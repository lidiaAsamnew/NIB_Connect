import assert from "node:assert/strict";
import express from "express";
import test, { after, before, beforeEach, mock } from "node:test";
import jwt from "jsonwebtoken";

const reportNames = [
  "orders",
  "vouchers",
  "weeklyAllocationStream",
  "sectorSummary",
  "regionSummary",
  "escrowTransactions",
];
const calls = Object.fromEntries(reportNames.map((name) => [name, []]));
let aggregateRows;
let paginatedRows;
let reportErrors;

function getPage(name, filters) {
  calls[name].push({ ...filters });
  if (reportErrors[name]) throw reportErrors[name];

  const rows = paginatedRows[name];
  const page = Number(filters.page);
  const pageSize = Number(filters.pageSize);

  return {
    records: rows.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      pageSize,
      total: rows.length,
      totalPages: Math.ceil(rows.length / pageSize),
    },
  };
}

mock.module(new URL("../src/services/reportingService.js", import.meta.url).href, {
  namedExports: {
    getComplianceSummary: async () => ({}),
    getWeeklyAllocationStream: async (filters) => {
      calls.weeklyAllocationStream.push({ ...filters });
      return aggregateRows.weeklyAllocationStream;
    },
    getSectorReport: async (filters) => {
      calls.sectorSummary.push({ ...filters });
      return aggregateRows.sectorSummary;
    },
    getRegionReport: async (filters) => {
      calls.regionSummary.push({ ...filters });
      return aggregateRows.regionSummary;
    },
    getOrderStatusReport: async () => [],
    getVoucherStatusReport: async () => [],
    getEscrowSummary: async () => [],
    getOrders: async (filters) => getPage("orders", filters),
    getVouchers: async (filters) => getPage("vouchers", filters),
    getEscrowTransactions: async (filters) => getPage("escrowTransactions", filters),
  },
});

const { default: complianceRoutes } = await import(
  "../src/routes/complianceRoutes.js"
);

const app = express();
app.use("/api/compliance", complianceRoutes);
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(error.errors?.length ? { errors: error.errors } : {}),
  });
});

const secret = process.env.JWT_SECRET || "default_jwt_secret_dev";
const endpoints = [
  {
    path: "/export/orders.csv",
    report: "orders",
    filename: "orders.csv",
  },
  {
    path: "/export/vouchers.csv",
    report: "vouchers",
    filename: "vouchers.csv",
  },
  {
    path: "/export/weekly-allocation-stream.csv",
    report: "weeklyAllocationStream",
    filename: "weekly-allocation-stream.csv",
  },
  {
    path: "/export/sector-summary.csv",
    report: "sectorSummary",
    filename: "sector-summary.csv",
  },
  {
    path: "/export/region-summary.csv",
    report: "regionSummary",
    filename: "region-summary.csv",
  },
  {
    path: "/export/escrow-transactions.csv",
    report: "escrowTransactions",
    filename: "escrow-transactions.csv",
  },
];

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/compliance`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

beforeEach(() => {
  for (const name of reportNames) calls[name].length = 0;
  aggregateRows = {
    weeklyAllocationStream: [],
    sectorSummary: [],
    regionSummary: [],
  };
  paginatedRows = {
    orders: [],
    vouchers: [],
    escrowTransactions: [],
  };
  reportErrors = {};
});

function makeToken(role) {
  return jwt.sign({ id: "csv-export-test-user", role }, secret, {
    expiresIn: "5m",
  });
}

function authorizedRequest(path, role = "EU_COMPLIANCE_OFFICER") {
  return fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${makeToken(role)}` },
  });
}

test("serves all six CSV exports with their required headers and filenames", async () => {
  for (const endpoint of endpoints) {
    const response = await authorizedRequest(endpoint.path);

    assert.equal(response.status, 200, endpoint.path);
    assert.equal(
      response.headers.get("content-type"),
      "text/csv; charset=utf-8",
      endpoint.path
    );
    assert.equal(
      response.headers.get("content-disposition"),
      `attachment; filename="${endpoint.filename}"`,
      endpoint.path
    );
  }
});

test("allows NIB_SYSTEM_OPERATOR to access all six CSV exports", async () => {
  for (const endpoint of endpoints) {
    const response = await authorizedRequest(
      endpoint.path,
      "NIB_SYSTEM_OPERATOR"
    );

    assert.equal(response.status, 200, endpoint.path);
  }
});

test("requires compliance authorization for every CSV export", async () => {
  for (const endpoint of endpoints) {
    const unauthenticated = await fetch(`${baseUrl}${endpoint.path}`);
    assert.equal(unauthenticated.status, 401, endpoint.path);

    const forbidden = await authorizedRequest(endpoint.path, "SUPPLIER");
    assert.equal(forbidden.status, 403, endpoint.path);
  }

  for (const name of reportNames) {
    assert.equal(calls[name].length, 0);
  }
});

test("passes supported query filters to each reporting function", async () => {
  const filtersByEndpoint = [
    {
      path: endpoints[0].path,
      report: "orders",
      query: "startDate=2026-01-01&endDate=2026-01-31&status=PLACED&sector=Agriculture&region=North&search=order-7&supplierId=supplier-2",
      filters: {
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        status: "PLACED",
        sector: "Agriculture",
        region: "North",
        search: "order-7",
        supplierId: "supplier-2",
      },
    },
    {
      path: endpoints[1].path,
      report: "vouchers",
      query: "startDate=2026-02-01&endDate=2026-02-28&status=ALLOCATED&startupId=startup-3&sector=Food&region=South",
      filters: {
        startDate: "2026-02-01",
        endDate: "2026-02-28",
        status: "ALLOCATED",
        startupId: "startup-3",
        sector: "Food",
        region: "South",
      },
    },
    {
      path: endpoints[2].path,
      report: "weeklyAllocationStream",
      query: "startDate=2026-03-01&endDate=2026-03-31&sector=Trade&region=East",
      filters: {
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        sector: "Trade",
        region: "East",
      },
    },
    {
      path: endpoints[3].path,
      report: "sectorSummary",
      query: "startDate=2026-04-01&endDate=2026-04-30&status=CANCELLED&sector=Health&region=West",
      filters: {
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "CANCELLED",
        sector: "Health",
        region: "West",
      },
    },
    {
      path: endpoints[4].path,
      report: "regionSummary",
      query: "startDate=2026-05-01&endDate=2026-05-31&status=VERIFIED_AND_CLEARED&sector=Energy&region=Central",
      filters: {
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        status: "VERIFIED_AND_CLEARED",
        sector: "Energy",
        region: "Central",
      },
    },
    {
      path: endpoints[5].path,
      report: "escrowTransactions",
      query: "startDate=2026-06-01&endDate=2026-06-30&direction=CREDIT&status=COMPLETED&orderId=order-9&voucherId=voucher-4&sector=Retail&region=North",
      filters: {
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        direction: "CREDIT",
        status: "COMPLETED",
        orderId: "order-9",
        voucherId: "voucher-4",
        sector: "Retail",
        region: "North",
      },
    },
  ];

  for (const item of filtersByEndpoint) {
    const response = await authorizedRequest(`${item.path}?${item.query}`);
    assert.equal(response.status, 200);
    assert.deepEqual(calls[item.report][0], {
      ...item.filters,
      ...(item.report === "orders" ||
      item.report === "vouchers" ||
      item.report === "escrowTransactions"
        ? { page: "1", pageSize: "100" }
        : {}),
    });
  }
});

test("exports every matching order, voucher, and escrow page", async () => {
  for (const name of ["orders", "vouchers", "escrowTransactions"]) {
    paginatedRows[name] = Array.from({ length: 101 }, (_, index) => ({
      id: `${name}-${String(index + 1).padStart(3, "0")}`,
    }));
  }

  for (const endpoint of [endpoints[0], endpoints[1], endpoints[5]]) {
    const response = await authorizedRequest(endpoint.path);
    const csv = await response.text();

    assert.equal(response.status, 200);
    assert.ok(csv.includes(`${endpoint.report}-001`));
    assert.ok(csv.includes(`${endpoint.report}-101`));
    assert.deepEqual(
      calls[endpoint.report].map(({ page, pageSize }) => [page, pageSize]),
      [
        ["1", "100"],
        ["2", "100"],
      ]
    );
  }
});

test("preserves report-service validation status for paginated exports", async () => {
  reportErrors.orders = Object.assign(new Error("Invalid status"), {
    statusCode: 400,
    errors: ["status is invalid"],
  });

  const response = await authorizedRequest(
    `${endpoints[0].path}?status=INVALID`
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.message, /failed to fetch page 1: Invalid status/u);
  assert.deepEqual(body.errors, ["status is invalid"]);
});

test("CSV output escapes delimiters and protects formula-like text", async () => {
  const formula = '=HYPERLINK("https://example.test","open"),\nsecond';
  aggregateRows.weeklyAllocationStream = [
    {
      euReportingWeek: "2026-46",
      marketSector: formula,
      grossVoucherValueETB: "1200.00",
      socioEconomicSavingsETB: "12.00",
      clearedETB: "1188.00",
    },
  ];

  const response = await authorizedRequest(endpoints[2].path);
  const csv = await response.text();
  const escapedCell = "\"'=HYPERLINK(\"\"https://example.test\"\",\"\"open\"\"),\nsecond\"";

  assert.equal(response.status, 200);
  assert.ok(csv.includes(escapedCell));
});

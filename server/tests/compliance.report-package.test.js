import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import express from "express";
import test, { after, before, beforeEach, mock } from "node:test";
import jwt from "jsonwebtoken";
import { unzipSync } from "fflate";

const weeklyRows = [
  {
    euReportingWeek: "2026-46",
    marketSector: "Agriculture",
    grossVoucherValueETB: "1200.00",
    socioEconomicSavingsETB: "12.00",
    clearedETB: "1188.00",
  },
];

let receivedFilters;

mock.module(new URL("../src/services/reportingService.js", import.meta.url).href, {
  namedExports: {
    getComplianceSummary: async () => ({}),
    getWeeklyAllocationStream: async (filters) => {
      receivedFilters = filters;
      return weeklyRows;
    },
    getSectorReport: async () => [],
    getRegionReport: async () => [],
    getOrders: async () => ({
      records: [],
      pagination: { total: 0, totalPages: 0 },
    }),
    getVouchers: async () => ({
      records: [],
      pagination: { total: 0, totalPages: 0 },
    }),
    getEscrowTransactions: async () => ({
      records: [],
      pagination: { total: 0, totalPages: 0 },
    }),
    getOrderStatusReport: async () => [],
    getVoucherStatusReport: async () => [],
    getEscrowSummary: async () => [],
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
  });
});

const secret = process.env.JWT_SECRET || "default_jwt_secret_dev";
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
  receivedFilters = undefined;
});

function makeToken(role) {
  return jwt.sign({ id: "report-package-test-user", role }, secret, {
    expiresIn: "5m",
  });
}

function authorizedRequest(path, role) {
  return fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${makeToken(role)}` },
  });
}

test("returns the JSON weekly-sector package with matching checksum and filters", async () => {
  const query = "?startDate=2026-11-01&endDate=2026-11-16&sector=Agriculture";
  const response = await authorizedRequest(
    `/report-package${query}`,
    "EU_COMPLIANCE_OFFICER"
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/u);
  assert.equal(body.success, true);
  assert.equal(body.data.packageType, "weekly-sector");
  assert.equal(
    body.data.generatedAt,
    new Date(body.data.generatedAt).toISOString()
  );
  assert.equal(body.data.generatedBy, "EU_COMPLIANCE_OFFICER");
  assert.deepEqual(body.data.filters, {
    startDate: "2026-11-01",
    endDate: "2026-11-16",
  });
  assert.deepEqual(receivedFilters, body.data.filters);
  assert.deepEqual(body.data.data, weeklyRows);
  assert.equal(body.data.recordCount, weeklyRows.length);
  assert.equal(
    body.data.checksum,
    createHash("sha256").update(JSON.stringify(body.data.data)).digest("hex")
  );
});

test("uses the authenticated operator role for generatedBy", async () => {
  const response = await authorizedRequest(
    "/report-package",
    "NIB_SYSTEM_OPERATOR"
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.generatedBy, "NIB_SYSTEM_OPERATOR");
});

test("rejects unauthenticated and unauthorized users", async () => {
  const unauthenticatedResponse = await fetch(`${baseUrl}/report-package`);
  assert.equal(unauthenticatedResponse.status, 401);

  const unauthorizedResponse = await authorizedRequest(
    "/report-package",
    "SUPPLIER"
  );
  assert.equal(unauthorizedResponse.status, 403);
});

test("keeps the ZIP report package on its separate endpoint", async () => {
  const response = await authorizedRequest(
    "/report-package.zip",
    "EU_COMPLIANCE_OFFICER"
  );
  const zip = new Uint8Array(await response.arrayBuffer());
  const entries = unzipSync(zip);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/zip/u);
  assert.ok(entries["manifest.json"]);
  assert.ok(entries["weekly-allocation-stream.csv"]);
});

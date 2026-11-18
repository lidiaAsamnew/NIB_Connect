import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import test, { beforeEach, mock } from "node:test";

const reportNames = [
  "getWeeklyAllocationStream",
  "getSectorReport",
  "getRegionReport",
  "getOrders",
  "getVouchers",
  "getEscrowTransactions",
];

const calls = Object.fromEntries(reportNames.map((name) => [name, []]));
let handlers;

const reportingServiceMocks = Object.fromEntries(
  reportNames.map((name) => [
    name,
    async (filters) => {
      calls[name].push(filters);
      return handlers[name](filters);
    },
  ])
);

mock.module(new URL("../src/services/reportingService.js", import.meta.url).href, {
  namedExports: reportingServiceMocks,
});

const { generateComplianceReportPackage } = await import(
  "../src/services/reportPackageService.js"
);

const expectedFiles = [
  "weekly-allocation-stream.csv",
  "sector-report.csv",
  "region-report.csv",
  "orders.csv",
  "vouchers.csv",
  "escrow-transactions.csv",
  "manifest.json",
];

const expectedHeaders = {
  "weekly-allocation-stream.csv": [
    "euReportingWeek",
    "marketSector",
    "grossVoucherValueETB",
    "socioEconomicSavingsETB",
    "clearedETB",
  ],
  "sector-report.csv": [
    "sector",
    "totalOrders",
    "clearedOrders",
    "grossValue",
    "savings",
    "clearedValue",
  ],
  "region-report.csv": [
    "region",
    "totalOrders",
    "clearedOrders",
    "grossValue",
    "savings",
    "clearedValue",
    "totalStartups",
  ],
  "orders.csv": [
    "id",
    "startupId",
    "supplierId",
    "voucherId",
    "grossAmount",
    "discountApplied",
    "netAmountToPay",
    "status",
    "dispatchedAt",
    "arrivedAt",
    "clearedAt",
    "createdAt",
    "updatedAt",
    "startup",
    "supplier",
    "voucher",
    "items",
  ],
  "vouchers.csv": [
    "id",
    "startupId",
    "amount",
    "status",
    "allocatedById",
    "expiresAt",
    "createdAt",
    "updatedAt",
    "startup",
    "committedOrder",
  ],
  "escrow-transactions.csv": [
    "id",
    "orderId",
    "voucherId",
    "direction",
    "amount",
    "reference",
    "description",
    "status",
    "createdAt",
    "order",
    "voucher",
  ],
};

class DecimalLike {
  constructor(value) {
    this.value = value;
  }

  toFixed() {
    return this.value;
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

function pageResult(records, filters, total, totalPages = Math.ceil(total / 100)) {
  return {
    records,
    pagination: {
      page: Number(filters.page),
      pageSize: Number(filters.pageSize),
      total,
      totalPages,
    },
  };
}

function createDefaultHandlers() {
  return {
    getWeeklyAllocationStream: async () => [],
    getSectorReport: async () => [],
    getRegionReport: async () => [],
    getOrders: async (filters) => pageResult([], filters, 0),
    getVouchers: async (filters) => pageResult([], filters, 0),
    getEscrowTransactions: async (filters) => pageResult([], filters, 0),
  };
}

function readZip(buffer) {
  return unzipSync(buffer);
}

function readCsv(zipFiles, filename) {
  const csv = new TextDecoder("utf-8").decode(zipFiles[filename]);
  const input = csv.startsWith("\uFEFF") ? csv.slice(1) : csv;
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character === '"') {
      if (inQuotes && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\r" || character === "\n") && !inQuotes) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && input[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function csvCell(rows, column, rowIndex = 1) {
  const columnIndex = rows[0].indexOf(column);
  assert.notEqual(columnIndex, -1, `CSV is missing the ${column} column`);
  return rows[rowIndex][columnIndex];
}

function makeRecord(id) {
  return { id };
}

beforeEach(() => {
  handlers = createDefaultHandlers();
  for (const name of reportNames) calls[name].length = 0;
});

test("creates verifiable CSV files for all six reports", async () => {
  const weeklyText = 'እርሻ, "ንግድ"\nደሴ';
  const generatedDate = new Date("2026-11-16T12:00:00.000Z");
  const filters = {
    startDate: "2026-11-01",
    endDate: "2026-11-16",
    sector: "  Agriculture  ",
    region: " Addis Ababa ",
  };

  handlers.getWeeklyAllocationStream = async () => [
    {
      euReportingWeek: "2026-46",
      marketSector: weeklyText,
      grossVoucherValueETB: "1200.00",
      socioEconomicSavingsETB: "12.00",
      clearedETB: "1188.00",
    },
  ];
  handlers.getSectorReport = async () => [
    {
      sector: "Agriculture",
      totalOrders: 1,
      clearedOrders: 1,
      grossValue: "1200.00",
      savings: "12.00",
      clearedValue: "1188.00",
    },
  ];
  handlers.getRegionReport = async () => [
    {
      region: "Addis Ababa",
      totalOrders: 1,
      clearedOrders: 1,
      grossValue: "1200.00",
      savings: "12.00",
      clearedValue: "1188.00",
      totalStartups: 1,
    },
  ];
  handlers.getOrders = async (requestFilters) =>
    pageResult(
      [
        {
          id: "order-1",
          startupId: "startup-1",
          supplierId: "supplier-1",
          voucherId: "voucher-1",
          grossAmount: new DecimalLike("1234.56"),
          discountApplied: -12.5,
          netAmountToPay: "-1222.06",
          status: "VERIFIED_AND_CLEARED",
          dispatchedAt: null,
          arrivedAt: null,
          clearedAt: null,
          createdAt: generatedDate,
          updatedAt: generatedDate,
          startup: { businessName: "ሰላም", sector: "Agriculture", region: "Addis Ababa" },
          supplier: { companyName: "Supplier" },
          voucher: { id: "voucher-1", amount: "1234.56", status: "REDEEMED_AND_SETTLED" },
          items: [],
        },
      ],
      requestFilters,
      1
    );
  handlers.getVouchers = async (requestFilters) =>
    pageResult(
      [
        {
          id: "voucher-1",
          startupId: "startup-1",
          amount: new DecimalLike("1234.56"),
          status: "ALLOCATED",
          allocatedById: "user-1",
          expiresAt: null,
          createdAt: generatedDate,
          updatedAt: generatedDate,
          startup: { businessName: "ሰላም", sector: "Agriculture", region: "Addis Ababa" },
          committedOrder: null,
        },
      ],
      requestFilters,
      1
    );
  handlers.getEscrowTransactions = async (requestFilters) =>
    pageResult(
      [
        {
          id: "escrow-1",
          orderId: "order-1",
          voucherId: "voucher-1",
          direction: "CREDIT",
          amount: new DecimalLike("1234.56"),
          reference: "ref-1",
          description: '=HYPERLINK("https://example.test")',
          status: "COMPLETED",
          createdAt: generatedDate,
          order: { id: "order-1", status: "VERIFIED_AND_CLEARED" },
          voucher: { id: "voucher-1", amount: "1234.56", status: "ALLOCATED" },
        },
      ],
      requestFilters,
      1
    );

  const { buffer, filename } = await generateComplianceReportPackage(filters);
  const zipFiles = readZip(buffer);
  const actualFiles = Object.keys(zipFiles).sort();

  assert.deepEqual(actualFiles, [...expectedFiles].sort());
  assert.match(filename, /^eu-compliance-report-\d{4}-\d{2}-\d{2}\.zip$/u);

  for (const [csvFilename, headers] of Object.entries(expectedHeaders)) {
    const rows = readCsv(zipFiles, csvFilename);
    assert.deepEqual(rows[0], headers);
    assert.equal(rows.length - 1, 1);
  }

  const weeklyRows = readCsv(zipFiles, "weekly-allocation-stream.csv");
  assert.equal(csvCell(weeklyRows, "marketSector"), weeklyText);

  const orderRows = readCsv(zipFiles, "orders.csv");
  assert.equal(csvCell(orderRows, "grossAmount"), "1234.56");
  assert.equal(csvCell(orderRows, "discountApplied"), "-12.5");
  assert.equal(csvCell(orderRows, "netAmountToPay"), "-1222.06");
  assert.equal(csvCell(orderRows, "createdAt"), generatedDate.toISOString());
  assert.equal(JSON.parse(csvCell(orderRows, "startup")).businessName, "ሰላም");

  const voucherRows = readCsv(zipFiles, "vouchers.csv");
  assert.equal(csvCell(voucherRows, "amount"), "1234.56");

  const escrowRows = readCsv(zipFiles, "escrow-transactions.csv");
  assert.equal(csvCell(escrowRows, "amount"), "1234.56");
  assert.equal(
    csvCell(escrowRows, "description"),
    `'=HYPERLINK("https://example.test")`
  );

  const manifest = JSON.parse(
    new TextDecoder("utf-8").decode(zipFiles["manifest.json"])
  );
  assert.equal(manifest.generatedAt, new Date(manifest.generatedAt).toISOString());
  assert.deepEqual(manifest.appliedFilters, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    sector: "Agriculture",
    region: "Addis Ababa",
  });
  assert.match(manifest.notes.join(" "), /weekly allocation applies date filters only/i);

  for (const file of manifest.files) {
    const csvRows = readCsv(zipFiles, file.filename);
    const expectedChecksum = createHash("sha256")
      .update(zipFiles[file.filename])
      .digest("hex");

    assert.equal(file.recordCount, csvRows.length - 1);
    assert.equal(file.sha256, expectedChecksum);
  }

  const expectedFilters = manifest.appliedFilters;
  for (const name of reportNames) {
    assert.deepEqual(calls[name][0], {
      ...expectedFilters,
      ...(name === "getOrders" ||
      name === "getVouchers" ||
      name === "getEscrowTransactions"
        ? { page: "1", pageSize: "100" }
        : {}),
    });
  }
});

test("collects multiple pages using string pagination parameters", async () => {
  const paginatedNames = [
    "getOrders",
    "getVouchers",
    "getEscrowTransactions",
  ];

  for (const name of paginatedNames) {
    handlers[name] = async (filters) => {
      const page = Number(filters.page);
      const records =
        page === 1
          ? Array.from({ length: 100 }, (_, index) => makeRecord(`${name}-${index}`))
          : [makeRecord(`${name}-100`)];
      return pageResult(records, filters, 101, 2);
    };
  }

  const { buffer } = await generateComplianceReportPackage();
  const zipFiles = readZip(buffer);

  for (const [name, filename] of [
    ["getOrders", "orders.csv"],
    ["getVouchers", "vouchers.csv"],
    ["getEscrowTransactions", "escrow-transactions.csv"],
  ]) {
    assert.deepEqual(
      calls[name].map(({ page, pageSize }) => [page, pageSize]),
      [
        ["1", "100"],
        ["2", "100"],
      ]
    );

    const rows = readCsv(zipFiles, filename);
    assert.equal(rows.length - 1, 101);
    assert.equal(csvCell(rows, "id", 101), `${name}-100`);
  }
});

test("accepts zero-record paginated reports", async () => {
  const { buffer } = await generateComplianceReportPackage();
  const zipFiles = readZip(buffer);
  const manifest = JSON.parse(
    new TextDecoder("utf-8").decode(zipFiles["manifest.json"])
  );

  for (const name of [
    "getOrders",
    "getVouchers",
    "getEscrowTransactions",
  ]) {
    assert.deepEqual(
      calls[name].map(({ page, pageSize }) => [page, pageSize]),
      [["1", "100"]]
    );
  }

  for (const file of manifest.files) {
    assert.equal(file.recordCount, 0);
    assert.equal(readCsv(zipFiles, file.filename).length, 1);
  }
});

test("rejects when collected records do not match pagination total", async () => {
  handlers.getOrders = async (filters) =>
    pageResult([makeRecord("order-1")], filters, 2, 1);

  await assert.rejects(
    generateComplianceReportPackage(),
    /Orders: expected 2 records but collected 1/u
  );
});

test("rejects a page failure without returning a ZIP", async () => {
  handlers.getOrders = async (filters) => {
    if (filters.page === "2") throw new Error("page two unavailable");
    return pageResult(
      Array.from({ length: 100 }, (_, index) => makeRecord(`order-${index}`)),
      filters,
      101,
      2
    );
  };

  await assert.rejects(
    generateComplianceReportPackage(),
    /Orders: failed to fetch page 2: page two unavailable/u
  );
});

test("rejects report-generation errors without returning a ZIP", async () => {
  handlers.getSectorReport = async () => {
    throw new Error("sector report unavailable");
  };

  await assert.rejects(
    generateComplianceReportPackage(),
    /sector report unavailable/u
  );
});

import { createHash } from "node:crypto";
import { PassThrough } from "node:stream";
import { ZipArchive } from "archiver";
import {
  getWeeklyAllocationStream,
  getSectorReport,
  getRegionReport,
  getOrders,
  getVouchers,
  getEscrowTransactions,
} from "./reportingService.js";

const PAGE_SIZE = "100";

const reportDefinitions = [
  {
    filename: "weekly-allocation-stream.csv",
    columns: [
      "euReportingWeek",
      "marketSector",
      "grossVoucherValueETB",
      "socioEconomicSavingsETB",
      "clearedETB",
    ],
  },
  {
    filename: "sector-report.csv",
    columns: [
      "sector",
      "totalOrders",
      "clearedOrders",
      "grossValue",
      "savings",
      "clearedValue",
    ],
  },
  {
    filename: "region-report.csv",
    columns: [
      "region",
      "totalOrders",
      "clearedOrders",
      "grossValue",
      "savings",
      "clearedValue",
      "totalStartups",
    ],
  },
  {
    filename: "orders.csv",
    columns: [
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
  },
  {
    filename: "vouchers.csv",
    columns: [
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
  },
  {
    filename: "escrow-transactions.csv",
    columns: [
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
  },
];

function normalizeFilters(filters = {}) {
  const normalized = {};

  if (filters.startDate) normalized.startDate = filters.startDate;
  if (filters.endDate) normalized.endDate = filters.endDate;
  if (typeof filters.sector === "string" && filters.sector.trim()) {
    normalized.sector = filters.sector.trim();
  }
  if (typeof filters.region === "string" && filters.region.trim()) {
    normalized.region = filters.region.trim();
  }

  return normalized;
}

function serializeCell(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && typeof value.toFixed === "function") {
    return value.toString();
  }
  if (typeof value === "object") return JSON.stringify(value) ?? "";
  return String(value);
}

function escapeCsvCell(value) {
  let text = serializeCell(value);
  const isNumericValue =
    typeof value === "number" ||
    typeof value === "bigint" ||
    (typeof value === "string" &&
      /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(text.trim()));

  if (!isNumericValue && /^\s*[=+\-@]/u.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/u.test(text)
    ? `"${text.replace(/"/gu, '""')}"`
    : text;
}

function createCsvBuffer(rows, columns) {
  const header = columns.map(escapeCsvCell).join(",");
  const records = rows.map((row) =>
    columns.map((column) => escapeCsvCell(row?.[column])).join(",")
  );
  const csv = `\uFEFF${[header, ...records].join("\r\n")}`;

  return Buffer.from(csv, "utf8");
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function getAllPages(reportName, getReport, filters) {
  let firstPage;

  try {
    firstPage = await getReport({
      ...filters,
      page: "1",
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    throw new Error(
      `${reportName}: failed to fetch page 1: ${getErrorMessage(error)}`
    );
  }

  const { records, pagination } = firstPage;
  const expectedTotal = pagination?.total;
  const totalPages = pagination?.totalPages;

  if (
    !Array.isArray(records) ||
    !Number.isSafeInteger(expectedTotal) ||
    expectedTotal < 0 ||
    !Number.isSafeInteger(totalPages) ||
    totalPages < 0
  ) {
    throw new Error(`${reportName}: received invalid pagination data.`);
  }

  const allRecords = [...records];

  for (let page = 2; page <= totalPages; page += 1) {
    let result;

    try {
      result = await getReport({
        ...filters,
        page: String(page),
        pageSize: PAGE_SIZE,
      });
    } catch (error) {
      throw new Error(
        `${reportName}: failed to fetch page ${page}: ${getErrorMessage(error)}`
      );
    }

    if (
      !Array.isArray(result.records) ||
      result.pagination?.total !== expectedTotal
    ) {
      throw new Error(
        `${reportName}: pagination data changed while fetching page ${page}.`
      );
    }

    allRecords.push(...result.records);
  }

  if (allRecords.length !== expectedTotal) {
    throw new Error(
      `${reportName}: expected ${expectedTotal} records but collected ${allRecords.length}.`
    );
  }

  return allRecords;
}

function createZipBuffer(files) {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const output = new PassThrough();
    const chunks = [];
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    archive.on("error", fail);
    archive.on("warning", fail);
    output.on("error", fail);
    output.on("data", (chunk) => chunks.push(chunk));
    output.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });

    archive.pipe(output);

    for (const file of files) {
      archive.append(file.content, { name: file.filename });
    }

    archive.finalize().catch(fail);
  });
}

export async function generateComplianceReportPackage(filters = {}) {
  const appliedFilters = normalizeFilters(filters);
  const generatedAt = new Date().toISOString();
  const reports = [
    await getWeeklyAllocationStream(appliedFilters),
    await getSectorReport(appliedFilters),
    await getRegionReport(appliedFilters),
    await getAllPages("Orders", getOrders, appliedFilters),
    await getAllPages("Vouchers", getVouchers, appliedFilters),
    await getAllPages("Escrow transactions", getEscrowTransactions, appliedFilters),
  ];

  const csvFiles = reports.map((rows, index) => {
    const definition = reportDefinitions[index];
    const content = createCsvBuffer(rows, definition.columns);

    return {
      filename: definition.filename,
      content,
      recordCount: rows.length,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  });

  const manifest = {
    generatedAt,
    appliedFilters,
    notes: [
      "Weekly allocation applies date filters only; sector and region filters are not applied to that report.",
    ],
    files: csvFiles.map(({ filename, recordCount, sha256 }) => ({
      filename,
      recordCount,
      sha256,
    })),
  };
  const packageFiles = [
    ...csvFiles,
    {
      filename: "manifest.json",
      content: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    },
  ];
  const buffer = await createZipBuffer(packageFiles);
  const filename = `eu-compliance-report-${generatedAt.slice(0, 10)}.zip`;

  return { buffer, filename };
}

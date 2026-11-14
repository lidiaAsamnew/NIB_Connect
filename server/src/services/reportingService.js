
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.ts";
import { BadRequestError } from "../utils/errors.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ORDER_STATUSES = [
  "PLACED",
  "DISPATCHED_IN_TRANSIT",
  "DELIVERED_PENDING_HANDSHAKE",
  "VERIFIED_AND_CLEARED",
  "CANCELLED",
];
const VOUCHER_STATUSES = [
  "ALLOCATED",
  "COMMITTED_TO_ORDER",
  "REDEEMED_AND_SETTLED",
  "EXPIRED",
  "CANCELLED",
];
const ESCROW_DIRECTIONS = ["DEBIT", "CREDIT"];

// Convert Prisma Decimal values to safe strings.
function money(value) {
  if (value == null) return "0.00";

  if (typeof value.toFixed === "function") {
    return value.toFixed(2);
  }

  return Number(value).toFixed(2);
}

// Validate optional date filters.
function buildDateFilter(filters = {}) {
  const createdAt = {};

  if (filters.startDate) {
    if (typeof filters.startDate !== "string") {
      throw new BadRequestError("Invalid startDate");
    }

    const date = new Date(filters.startDate);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError("Invalid startDate");
    }

    createdAt.gte = date;
  }

  if (filters.endDate) {
    if (typeof filters.endDate !== "string") {
      throw new BadRequestError("Invalid endDate");
    }

    const date = new Date(filters.endDate);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError("Invalid endDate");
    }

    // Include the entire day when endDate is YYYY-MM-DD.
    if (/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
      date.setUTCHours(23, 59, 59, 999);
    }

    createdAt.lte = date;
  }

  if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
    throw new BadRequestError("startDate must be on or before endDate");
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
}

// Common filters for order reports.
function buildOrderWhere(filters = {}) {
  return {
    ...buildDateFilter(filters),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.sector || filters.region
      ? {
          startup: {
            ...(filters.sector ? { sector: filters.sector } : {}),
            ...(filters.region ? { region: filters.region } : {}),
          },
        }
      : {}),
  };
}

function validateEnumFilter(value, allowedValues, fieldName) {
  if (value && !allowedValues.includes(value)) {
    throw new BadRequestError(`Invalid ${fieldName}`);
  }
}

function parsePagination(filters = {}) {
  function parsePositiveInteger(value, name, defaultValue) {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
      throw new BadRequestError(`${name} must be a positive integer`);
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new BadRequestError(`${name} must be a safe integer`);
    }

    return parsed;
  }

  const page = parsePositiveInteger(filters.page, "page", 1);
  const pageSize = parsePositiveInteger(
    filters.pageSize,
    "pageSize",
    DEFAULT_PAGE_SIZE
  );

  if (pageSize > MAX_PAGE_SIZE) {
    throw new BadRequestError(`pageSize cannot exceed ${MAX_PAGE_SIZE}`);
  }

  const skip = (page - 1) * pageSize;
  if (!Number.isSafeInteger(skip)) {
    throw new BadRequestError("page and pageSize exceed the supported range");
  }

  return { page, pageSize, skip };
}

async function getPaginatedRecords(model, where, select, filters = {}) {
  const { page, pageSize, skip } = parsePagination(filters);
  const [records, total] = await Promise.all([
    model.findMany({
      where,
      select,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: pageSize,
    }),
    model.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Add monetary values without floating-point arithmetic.
function addMoney(current, value) {
  const toCents = (amount) => {
    const [whole, fraction = ""] = amount.toString().split(".");
    return BigInt(whole) * 100n +
      BigInt((fraction + "00").slice(0, 2));
  };

  const cents = toCents(current) + toCents(value || 0);
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;
}

// 1. Overall compliance dashboard summary.
export async function getComplianceSummary() {
  const [
    totalStartups,
    totalSuppliers,
    verifiedSuppliers,
    totalVouchers,
    voucherGroups,
    totalOrders,
    orderGroups,
    orderImpact,
    clearedImpact,
  ] = await Promise.all([
    prisma.startupProfile.count(),
    prisma.supplierProfile.count(),
    prisma.supplierProfile.count({ where: { isVerified: true } }),
    prisma.voucher.count(),
    prisma.voucher.groupBy({
      by: ["status"],
      _sum: { amount: true },
    }),
    prisma.order.count(),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.order.aggregate({
      _sum: {
        grossAmount: true,
        discountApplied: true,
      },
    }),
    prisma.order.aggregate({
      where: { status: "VERIFIED_AND_CLEARED" },
      _sum: { netAmountToPay: true },
    }),
  ]);

  const voucherValues = {
    allocatedValue: "0.00",
    committedValue: "0.00",
    settledValue: "0.00",
  };

  for (const group of voucherGroups) {
    if (group.status === "ALLOCATED") {
      voucherValues.allocatedValue = money(group._sum.amount);
    }
    if (group.status === "COMMITTED_TO_ORDER") {
      voucherValues.committedValue = money(group._sum.amount);
    }
    if (group.status === "REDEEMED_AND_SETTLED") {
      voucherValues.settledValue = money(group._sum.amount);
    }
  }

  const orders = {
    total: totalOrders,
    PLACED: 0,
    DISPATCHED_IN_TRANSIT: 0,
    DELIVERED_PENDING_HANDSHAKE: 0,
    VERIFIED_AND_CLEARED: 0,
  };

  for (const group of orderGroups) {
    if (Object.hasOwn(orders, group.status)) {
      orders[group.status] = group._count.id;
    }
  }

  return {
    startups: totalStartups,
    suppliers: totalSuppliers,
    verifiedSuppliers,
    totalVouchers,
    vouchers: voucherValues,
    orders,
    impact: {
      grossValue: money(orderImpact._sum.grossAmount),
      savings: money(orderImpact._sum.discountApplied),
      clearedValue: money(clearedImpact._sum.netAmountToPay),
    },
  };
}

// 2. Weekly allocation stream grouped by reporting week and sector.
export async function getWeeklyAllocationStream(filters = {}) {
  const dateFilter = buildDateFilter(filters).createdAt;
  const conditions = [];

  if (dateFilter?.gte) {
    conditions.push(Prisma.sql`o.createdAt >= ${dateFilter.gte}`);
  }
  if (dateFilter?.lte) {
    conditions.push(Prisma.sql`o.createdAt <= ${dateFilter.lte}`);
  }

  const whereClause = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT
      DATE_FORMAT(o.createdAt, '%Y-%u') AS euReportingWeek,
      sp.sector AS marketSector,
      SUM(o.grossAmount) AS grossVoucherValueETB,
      SUM(o.discountApplied) AS socioEconomicSavingsETB,
      SUM(CASE WHEN o.status = 'VERIFIED_AND_CLEARED' THEN o.netAmountToPay ELSE 0 END) AS clearedETB
    FROM \`Order\` o
    JOIN StartupProfile sp ON o.startupId = sp.id
    ${whereClause}
    GROUP BY DATE_FORMAT(o.createdAt, '%Y-%u'), sp.sector
    ORDER BY euReportingWeek ASC
  `);

  return rows.map((row) => ({
    euReportingWeek: row.euReportingWeek,
    marketSector: row.marketSector,
    grossVoucherValueETB: money(row.grossVoucherValueETB),
    socioEconomicSavingsETB: money(row.socioEconomicSavingsETB),
    clearedETB: money(row.clearedETB),
  }));
}

// Shared grouping logic for sector and region reports.
async function getGroupedOrderReport(groupField, filters = {}) {
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(filters),
    select: {
      startupId: true,
      grossAmount: true,
      discountApplied: true,
      netAmountToPay: true,
      status: true,
      startup: {
        select: {
          sector: true,
          region: true,
        },
      },
    },
  });

  const groups = new Map();

  for (const order of orders) {
    const name = order.startup[groupField];

    if (!groups.has(name)) {
      groups.set(name, {
        [groupField]: name,
        totalOrders: 0,
        clearedOrders: 0,
        grossValue: "0.00",
        savings: "0.00",
        clearedValue: "0.00",
        startupIds: new Set(),
      });
    }

    const group = groups.get(name);

    group.totalOrders += 1;
    group.startupIds.add(order.startupId);
    group.grossValue = addMoney(group.grossValue, order.grossAmount);
    group.savings = addMoney(group.savings, order.discountApplied);

    if (order.status === "VERIFIED_AND_CLEARED") {
      group.clearedOrders += 1;
      group.clearedValue = addMoney(
        group.clearedValue,
        order.netAmountToPay
      );
    }
  }

  return Array.from(groups.values()).map((group) => {
    const result = { ...group };

    if (groupField === "region") {
      result.totalStartups = group.startupIds.size;
    }

    delete result.startupIds;
    return result;
  });
}

// 3. Report grouped by market sector.
export async function getSectorReport(filters = {}) {
  return getGroupedOrderReport("sector", filters);
}

// 4. Report grouped by region.
export async function getRegionReport(filters = {}) {
  return getGroupedOrderReport("region", filters);
}

// 5. Report grouped by order status.
export async function getOrderStatusReport(filters = {}) {
  const groups = await prisma.order.groupBy({
    by: ["status"],
    where: buildOrderWhere(filters),
    _count: { id: true },
    _sum: {
      grossAmount: true,
      discountApplied: true,
      netAmountToPay: true,
    },
  });

  return groups.map((group) => ({
    status: group.status,
    orderCount: group._count.id,
    grossAmount: money(group._sum.grossAmount),
    socioeconomicSavings: money(group._sum.discountApplied),
    netAmount: money(group._sum.netAmountToPay),
  }));
}

// 6. Report grouped by voucher status.
export async function getVoucherStatusReport(filters = {}) {
  const where = {
    ...buildDateFilter(filters),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const groups = await prisma.voucher.groupBy({
    by: ["status"],
    where,
    _count: { id: true },
    _sum: { amount: true },
  });

  return groups.map((group) => ({
    status: group.status,
    voucherCount: group._count.id,
    totalAmount: money(group._sum.amount),
  }));
}

// 7. Escrow summary grouped by transaction direction and status.
export async function getEscrowSummary() {
  const groups = await prisma.escrowTransaction.groupBy({
    by: ["direction", "status"],
    _count: { id: true },
    _sum: { amount: true },
  });

  return groups.map((group) => ({
    direction: group.direction,
    status: group.status,
    transactionCount: group._count.id,
    totalAmount: money(group._sum.amount),
  }));
}

// 8. Individual order records with their reporting-relevant relationships.
export async function getOrders(filters = {}) {
  validateEnumFilter(filters.status, ORDER_STATUSES, "status");

  const where = {
    ...buildOrderWhere(filters),
    ...(filters.startupId ? { startupId: filters.startupId } : {}),
    ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
    ...(filters.voucherId ? { voucherId: filters.voucherId } : {}),
  };

  return getPaginatedRecords(
    prisma.order,
    where,
    {
      id: true,
      startupId: true,
      supplierId: true,
      voucherId: true,
      grossAmount: true,
      discountApplied: true,
      netAmountToPay: true,
      status: true,
      dispatchedAt: true,
      arrivedAt: true,
      clearedAt: true,
      createdAt: true,
      updatedAt: true,
      startup: {
        select: {
          businessName: true,
          sector: true,
          region: true,
        },
      },
      supplier: {
        select: {
          companyName: true,
        },
      },
      voucher: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    filters
  );
}

// 9. Individual voucher records with their startup and committed order.
export async function getVouchers(filters = {}) {
  validateEnumFilter(filters.status, VOUCHER_STATUSES, "status");

  const where = {
    ...buildDateFilter(filters),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.startupId ? { startupId: filters.startupId } : {}),
    ...(filters.allocatedById ? { allocatedById: filters.allocatedById } : {}),
  };

  return getPaginatedRecords(
    prisma.voucher,
    where,
    {
      id: true,
      startupId: true,
      amount: true,
      status: true,
      allocatedById: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      startup: {
        select: {
          businessName: true,
          sector: true,
          region: true,
        },
      },
      committedOrder: {
        select: {
          id: true,
          status: true,
          netAmountToPay: true,
        },
      },
    },
    filters
  );
}

// 10. Individual escrow transaction records with related order and voucher.
export async function getEscrowTransactions(filters = {}) {
  validateEnumFilter(filters.direction, ESCROW_DIRECTIONS, "direction");

  const where = {
    ...buildDateFilter(filters),
    ...(filters.direction ? { direction: filters.direction } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.orderId ? { orderId: filters.orderId } : {}),
    ...(filters.voucherId ? { voucherId: filters.voucherId } : {}),
  };

  return getPaginatedRecords(
    prisma.escrowTransaction,
    where,
    {
      id: true,
      orderId: true,
      voucherId: true,
      direction: true,
      amount: true,
      reference: true,
      description: true,
      status: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          status: true,
          startup: {
            select: {
              businessName: true,
              sector: true,
              region: true,
            },
          },
          supplier: {
            select: {
              companyName: true,
            },
          },
        },
      },
      voucher: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
    filters
  );
}

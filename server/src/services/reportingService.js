
import { prisma } from "../lib/prisma.js";
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
  return Number(value ?? 0).toFixed(2);
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

// Monday of the ISO reporting week (UTC).
function getWeekStart(date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);

  const day = result.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  result.setUTCDate(result.getUTCDate() - daysSinceMonday);

  return result.toISOString().slice(0, 10);
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
    totalOrders,
    clearedOrders,
    pendingOrders,
    totalVoucherValue,
    totalVouchers,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { status: "VERIFIED_AND_CLEARED" },
    }),
    prisma.order.count({
      where: {
        status: {
          notIn: ["VERIFIED_AND_CLEARED", "CANCELLED"],
        },
      },
    }),
    prisma.voucher.aggregate({
      _sum: { amount: true },
    }),
    prisma.voucher.count(),
  ]);

  return {
    totalOrders,
    clearedOrders,
    pendingOrders,
    totalVouchers,
    totalVoucherValue: money(totalVoucherValue._sum.amount),
  };
}

// 2. Weekly allocation stream grouped by reporting week and sector.
export async function getWeeklyAllocationStream(filters = {}) {
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(filters),
    select: {
      id: true,
      createdAt: true,
      status: true,
      grossAmount: true,
      discountApplied: true,
      netAmountToPay: true,
      startup: {
        select: {
          sector: true,
          region: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map();

  for (const order of orders) {
    const weekStart = getWeekStart(order.createdAt);
    const sector = order.startup.sector;
    const key = `${weekStart}|${sector}`;

    if (!groups.has(key)) {
      groups.set(key, {
        weekStart,
        sector,
        orderCount: 0,
        grossVoucherValue: "0.00",
        socioeconomicSavings: "0.00",
        clearedAmount: "0.00",
      });
    }

    const group = groups.get(key);

    group.orderCount += 1;
    group.grossVoucherValue = addMoney(
      group.grossVoucherValue,
      order.grossAmount
    );
    group.socioeconomicSavings = addMoney(
      group.socioeconomicSavings,
      order.discountApplied
    );

    if (order.status === "VERIFIED_AND_CLEARED") {
      group.clearedAmount = addMoney(
        group.clearedAmount,
        order.netAmountToPay
      );
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart)
  );
}

// Shared grouping logic for sector and region reports.
async function getGroupedOrderReport(groupField, filters = {}) {
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(filters),
    select: {
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
        orderCount: 0,
        clearedOrders: 0,
        grossAmount: "0.00",
        socioeconomicSavings: "0.00",
        clearedAmount: "0.00",
      });
    }

    const group = groups.get(name);

    group.orderCount += 1;
    group.grossAmount = addMoney(group.grossAmount, order.grossAmount);
    group.socioeconomicSavings = addMoney(
      group.socioeconomicSavings,
      order.discountApplied
    );

    if (order.status === "VERIFIED_AND_CLEARED") {
      group.clearedOrders += 1;
      group.clearedAmount = addMoney(
        group.clearedAmount,
        order.netAmountToPay
      );
    }
  }

  return Array.from(groups.values());
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

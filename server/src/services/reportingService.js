
import { prisma } from "../lib/prisma.js";

// Convert Prisma Decimal values to safe strings.
function money(value) {
  return Number(value ?? 0).toFixed(2);
}

// Validate optional date filters.
function buildDateFilter(filters = {}) {
  const createdAt = {};

  if (filters.startDate) {
    const date = new Date(filters.startDate);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid startDate");
    }

    createdAt.gte = date;
  }

  if (filters.endDate) {
    const date = new Date(filters.endDate);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid endDate");
    }

    // Include the entire day when endDate is YYYY-MM-DD.
    if (/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
      date.setUTCHours(23, 59, 59, 999);
    }

    createdAt.lte = date;
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

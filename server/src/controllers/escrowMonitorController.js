import { prisma } from "../lib/prisma.js";

const VOUCHER_STATUSES = ["ALLOCATED", "COMMITTED_TO_ORDER", "REDEEMED_AND_SETTLED"];
const ORDER_STATUSES = [
  "PLACED",
  "DISPATCHED_IN_TRANSIT",
  "DELIVERED_PENDING_HANDSHAKE",
  "VERIFIED_AND_CLEARED",
];

export async function getMonitorSummary(req, res, next) {
  try {
    // groupBy counts rows per status, like "how many vouchers in each status?"
    const [voucherGroups, orderGroups, recentTransactions] = await Promise.all([
      prisma.voucher.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.escrowTransaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Start every status at 0 so missing ones still show up
    const vouchers = Object.fromEntries(VOUCHER_STATUSES.map((s) => [s, 0]));
    voucherGroups.forEach((g) => {
      vouchers[g.status] = g._count._all;
    });

    const orders = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
    orderGroups.forEach((g) => {
      orders[g.status] = g._count._all;
    });

    res.json({
      success: true,
      data: {
        totalVouchers: Object.values(vouchers).reduce((a, b) => a + b, 0),
        totalOrders: Object.values(orders).reduce((a, b) => a + b, 0),
        vouchers,
        orders,
        recentEscrowTransactions: recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
}
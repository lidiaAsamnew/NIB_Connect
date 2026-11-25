const { rateLimit } = require("express-rate-limit");
const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorizePermission } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validate");
const { dateRangeFilter } = require("../utils/dateRange");
const { recordAuditLog } = require("../services/auditService");
const { createUserManagementRouter } = require("./userManagementRoutes");
const {
  orderListSchema,
  supplierIdSchema,
  supplierListSchema,
  unverifySupplierSchema,
  verifySupplierSchema,
  voucherListSchema,
} = require("../validators/operations.validator");

const ORDER_STATUSES = [
  "PLACED",
  "DISPATCHED_IN_TRANSIT",
  "DELIVERED_PENDING_HANDSHAKE",
  "VERIFIED_AND_CLEARED",
  "CANCELLED",
];
const supplierFields = {
  id: true,
  userId: true,
  companyName: true,
  tinNumber: true,
  discountRate: true,
  address: true,
  contactPerson: true,
  isVerified: true,
  verifiedAt: true,
  verificationRemarks: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, fullName: true, email: true } },
  verifiedBy: { select: { id: true, fullName: true } },
};

function money(value) {
  if (value == null) return "0.00";
  if (typeof value.toFixed === "function") return value.toFixed(2);
  return Number(value).toFixed(2);
}

function sumMoney(values) {
  const cents = values.reduce((total, value) => {
    const [whole, fraction = ""] = money(value).split(".");
    return total + BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
  }, 0n);
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;
}

function mapStatusCounts(groups, statuses) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0]));
  for (const group of groups) {
    if (Object.hasOwn(counts, group.status)) {
      counts[group.status] = group._count._all;
    }
  }
  return counts;
}

function mapVoucherValues(groups) {
  const allocated = [];
  const committed = [];
  const settled = [];
  for (const group of groups) {
    if (group.status === "ACTIVE" || group.status === "ALLOCATED") {
      allocated.push(group._sum.amount);
    } else if (group.status === "COMMITTED_TO_ORDER") {
      committed.push(group._sum.amount);
    } else if (group.status === "REDEEMED" || group.status === "REDEEMED_AND_SETTLED") {
      settled.push(group._sum.amount);
    }
  }
  return {
    allocatedValue: sumMoney(allocated),
    committedValue: sumMoney(committed),
    settledValue: sumMoney(settled),
  };
}

function buildPagination(page, limit) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

function createOperationsRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));
  router.use(authorizePermission("operations", "read"));
  router.use("/users", createUserManagementRouter({ prisma }));

  const sensitiveWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: async (req, res, next, options) => {
      try {
        await prisma.securityEvent.create({
          data: {
            userId: req.user.id,
            eventType: "OPERATOR_ROUTE_RATE_LIMITED",
            message: "An operator verification rate limit was exceeded.",
            metadata: { method: req.method, resource: req.baseUrl },
          },
        });
        return res.status(options.statusCode).json({
          success: false,
          message: "Too many supplier verification requests. Please try again later.",
        });
      } catch (error) {
        return next(error);
      }
    },
  });

  router.get("/dashboard", async (req, res, next) => {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const [
        totalUsers,
        startupOwners,
        supplierUsers,
        operators,
        euOfficers,
        totalStartups,
        totalSuppliers,
        verifiedSuppliers,
        unverifiedSuppliers,
        totalVouchers,
        voucherGroups,
        totalOrders,
        orderGroups,
        pendingHandshakeOrders,
        clearedOrders,
        totalSecurityEvents,
        failedLogins,
        suspiciousOtpAttempts,
        recentSecurityEvents,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "WOMEN_STARTUP_OWNER" } }),
        prisma.user.count({ where: { role: "TIER1_SUPPLIER" } }),
        prisma.user.count({ where: { role: "NIB_SYSTEM_OPERATOR" } }),
        prisma.user.count({ where: { role: "EU_COMPLIANCE_OFFICER" } }),
        prisma.startupProfile.count(),
        prisma.supplierProfile.count(),
        prisma.supplierProfile.count({ where: { isVerified: true } }),
        prisma.supplierProfile.count({ where: { isVerified: false } }),
        prisma.voucher.count(),
        prisma.voucher.groupBy({
          by: ["status"],
          _sum: { amount: true },
        }),
        prisma.order.count(),
        prisma.order.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.order.count({ where: { status: "DELIVERED_PENDING_HANDSHAKE" } }),
        prisma.order.count({ where: { status: "VERIFIED_AND_CLEARED" } }),
        prisma.securityEvent.count({ where: { createdAt: { gte: last24Hours } } }),
        prisma.securityEvent.count({
          where: { eventType: "LOGIN_FAILED", createdAt: { gte: last24Hours } },
        }),
        prisma.securityEvent.count({
          where: {
            eventType: { in: ["SUSPICIOUS_OTP_ATTEMPT", "OTP_BRUTE_FORCE_SUSPECTED"] },
            createdAt: { gte: last24Hours },
          },
        }),
        prisma.securityEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, userId: true, eventType: true, message: true, createdAt: true },
        }),
      ]);

      const ordersByStatus = mapStatusCounts(orderGroups, ORDER_STATUSES);
      return res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            startups: startupOwners,
            suppliers: supplierUsers,
            operators,
            euOfficers,
          },
          startups: { total: totalStartups },
          suppliers: {
            total: totalSuppliers,
            verified: verifiedSuppliers,
            unverified: unverifiedSuppliers,
          },
          vouchers: {
            total: totalVouchers,
            ...mapVoucherValues(voucherGroups),
          },
          orders: {
            total: totalOrders,
            byStatus: ordersByStatus,
            pendingHandshake: pendingHandshakeOrders,
            cleared: clearedOrders,
          },
          security: {
            totalEventsLast24Hours: totalSecurityEvents,
            failedLoginsLast24Hours: failedLogins,
            suspiciousOtpAttemptsLast24Hours: suspiciousOtpAttempts,
            recentEvents: recentSecurityEvents,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/suppliers", validate(supplierListSchema, "query"), async (req, res, next) => {
    const { status, search, page, limit } = req.validatedQuery;
    const where = {
      ...(status ? { isVerified: status === "verified" } : {}),
      ...(search ? {
        OR: [
          { companyName: { contains: search } },
          { tinNumber: { contains: search } },
        ],
      } : {}),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.supplierProfile.findMany({
          where,
          select: supplierFields,
          orderBy: { createdAt: "desc" },
          ...buildPagination(page, limit),
        }),
        prisma.supplierProfile.count({ where }),
      ]);
      return res.json({
        success: true,
        data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/suppliers/:id", validate(supplierIdSchema, "params"), async (req, res, next) => {
    try {
      const supplier = await prisma.supplierProfile.findUnique({
        where: { id: req.validatedParams.id },
        select: supplierFields,
      });
      if (!supplier) {
        return res.status(404).json({ success: false, message: "Supplier not found." });
      }
      return res.json({ success: true, data: supplier });
    } catch (error) {
      return next(error);
    }
  });

  router.patch(
    "/suppliers/:id/verify",
    sensitiveWriteLimiter,
    authorizePermission("supplierVerification", "approve"),
    validate(supplierIdSchema, "params"),
    validate(verifySupplierSchema),
    async (req, res, next) => {
      try {
        const result = await prisma.$transaction(async (transaction) => {
          const supplier = await transaction.supplierProfile.findUnique({
            where: { id: req.validatedParams.id },
            select: { id: true },
          });
          if (!supplier) return null;

          const updated = await transaction.supplierProfile.update({
            where: { id: supplier.id },
            data: {
              isVerified: true,
              verifiedAt: new Date(),
              verifiedById: req.user.id,
              verificationRemarks: req.validatedBody.remarks,
            },
            select: {
              id: true,
              companyName: true,
              isVerified: true,
              verifiedAt: true,
              verifiedById: true,
              verificationRemarks: true,
            },
          });
          const auditLog = await recordAuditLog(transaction, {
            actorId: req.user.id,
            action: "SUPPLIER_VERIFIED",
            entityType: "SUPPLIER_PROFILE",
            entityId: updated.id,
            metadata: { remarks: req.validatedBody.remarks },
          });
          return { supplier: updated, auditLog };
        });

        if (!result) {
          return res.status(404).json({ success: false, message: "Supplier not found." });
        }
        return res.json({
          success: true,
          message: "Supplier verified successfully.",
          data: {
            supplierId: result.supplier.id,
            companyName: result.supplier.companyName,
            isVerified: result.supplier.isVerified,
            verifiedAt: result.supplier.verifiedAt,
            verifiedBy: result.supplier.verifiedById,
            verificationRemarks: result.supplier.verificationRemarks,
            auditLogId: result.auditLog.id,
          },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.patch(
    "/suppliers/:id/unverify",
    sensitiveWriteLimiter,
    authorizePermission("supplierVerification", "approve"),
    validate(supplierIdSchema, "params"),
    validate(unverifySupplierSchema),
    async (req, res, next) => {
      try {
        const result = await prisma.$transaction(async (transaction) => {
          const supplier = await transaction.supplierProfile.findUnique({
            where: { id: req.validatedParams.id },
            select: { id: true },
          });
          if (!supplier) return null;

          const updated = await transaction.supplierProfile.update({
            where: { id: supplier.id },
            data: {
              isVerified: false,
              verifiedAt: null,
              verifiedById: null,
              verificationRemarks: req.validatedBody.remarks || null,
            },
            select: {
              id: true,
              companyName: true,
              isVerified: true,
              verifiedAt: true,
              verifiedById: true,
              verificationRemarks: true,
            },
          });
          const auditLog = await recordAuditLog(transaction, {
            actorId: req.user.id,
            action: "SUPPLIER_UNVERIFIED",
            entityType: "SUPPLIER_PROFILE",
            entityId: updated.id,
            metadata: { remarks: req.validatedBody.remarks || null },
          });
          return { supplier: updated, auditLog };
        });

        if (!result) {
          return res.status(404).json({ success: false, message: "Supplier not found." });
        }
        return res.json({
          success: true,
          message: "Supplier verification revoked.",
          data: {
            supplierId: result.supplier.id,
            companyName: result.supplier.companyName,
            isVerified: result.supplier.isVerified,
            verifiedAt: result.supplier.verifiedAt,
            verifiedBy: result.supplier.verifiedById,
            verificationRemarks: result.supplier.verificationRemarks,
            auditLogId: result.auditLog.id,
          },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.get("/vouchers", validate(voucherListSchema, "query"), async (req, res, next) => {
    const {
      status,
      startupId,
      expired,
      amountMin,
      amountMax,
      from,
      to,
      page,
      limit,
    } = req.validatedQuery;
    const where = {
      ...dateRangeFilter(from, to),
      ...(status ? { status } : {}),
      ...(startupId ? { OR: [{ startupId }, { recipientUserId: startupId }] } : {}),
    };
    if (amountMin !== undefined || amountMax !== undefined) {
      where.amount = {
        ...(amountMin !== undefined ? { gte: amountMin } : {}),
        ...(amountMax !== undefined ? { lte: amountMax } : {}),
      };
    }
    if (expired !== undefined) {
      where.AND = [
        ...(where.AND || []),
        expired
          ? { expiresAt: { lt: new Date() } }
          : { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      ];
    }

    try {
      const [items, total] = await Promise.all([
        prisma.voucher.findMany({
          where,
          select: {
            id: true,
            recipientUserId: true,
            startupId: true,
            allocatedByUserId: true,
            amount: true,
            status: true,
            createdAt: true,
            expiresAt: true,
            recipient: {
              select: {
                id: true,
                fullName: true,
                startupProfile: { select: { businessName: true } },
              },
            },
            startup: { select: { businessName: true } },
            committedOrder: { select: { id: true, status: true } },
          },
          orderBy: { createdAt: "desc" },
          ...buildPagination(page, limit),
        }),
        prisma.voucher.count({ where }),
      ]);
      return res.json({
        success: true,
        data: {
          items: items.map((item) => ({
            ...item,
            amount: money(item.amount),
            startupBusinessName:
              item.startup?.businessName ||
              item.recipient?.startupProfile?.businessName ||
              item.recipient?.fullName ||
              null,
            committedOrderId: item.committedOrder?.id || null,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post(
    "/vouchers/expire-overdue",
    authorizePermission("voucherExpiry", "expire"),
    async (req, res, next) => {
      const now = new Date();
      try {
        const expiredCount = await prisma.$transaction(async (transaction) => {
          const overdueVouchers = await transaction.voucher.findMany({
            where: {
              status: "ALLOCATED",
              expiresAt: { lt: now },
            },
            select: { id: true },
          });
          let updatedCount = 0;
          for (const voucher of overdueVouchers) {
            const updated = await transaction.voucher.updateMany({
              where: {
                id: voucher.id,
                status: "ALLOCATED",
                expiresAt: { lt: now },
              },
              data: { status: "EXPIRED" },
            });
            if (updated.count !== 1) continue;

            await recordAuditLog(transaction, {
              actorId: req.user.id,
              action: "VOUCHER_EXPIRED",
              entityType: "VOUCHER",
              entityId: voucher.id,
              metadata: { reason: "OVERDUE" },
            });
            updatedCount += 1;
          }
          return updatedCount;
        });

        return res.json({
          success: true,
          message: "Overdue vouchers expired.",
          data: { expiredCount },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.get("/vouchers/:id", validate(supplierIdSchema, "params"), async (req, res, next) => {
    try {
      const item = await prisma.voucher.findUnique({
        where: { id: req.validatedParams.id },
        select: {
          id: true,
          recipientUserId: true,
          startupId: true,
          allocatedByUserId: true,
          amount: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          recipient: {
            select: {
              id: true,
              fullName: true,
              startupProfile: { select: { businessName: true } },
            },
          },
          startup: { select: { businessName: true } },
          committedOrder: { select: { id: true, status: true } },
        },
      });
      if (!item) {
        return res.status(404).json({ success: false, message: "Voucher not found." });
      }
      return res.json({
        success: true,
        data: {
          ...item,
          amount: money(item.amount),
          startupBusinessName:
            item.startup?.businessName ||
            item.recipient?.startupProfile?.businessName ||
            item.recipient?.fullName ||
            null,
          committedOrderId: item.committedOrder?.id || null,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/orders", validate(orderListSchema, "query"), async (req, res, next) => {
    const { status, supplierId, startupId, waybillCode, from, to, page, limit } = req.validatedQuery;
    const where = {
      ...dateRangeFilter(from, to),
      ...(status ? { status } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(startupId ? { startupId } : {}),
      ...(waybillCode ? { waybillCode: { contains: waybillCode } } : {}),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          select: {
            id: true,
            startupId: true,
            supplierId: true,
            grossAmount: true,
            discountApplied: true,
            netAmountToPay: true,
            status: true,
            waybillCode: true,
            createdAt: true,
            dispatchedAt: true,
            arrivedAt: true,
            clearedAt: true,
            startup: { select: { businessName: true } },
            supplier: { select: { companyName: true } },
          },
          orderBy: { createdAt: "desc" },
          ...buildPagination(page, limit),
        }),
        prisma.order.count({ where }),
      ]);
      return res.json({
        success: true,
        data: {
          items: items.map((item) => ({
            ...item,
            grossAmount: money(item.grossAmount),
            discountApplied: money(item.discountApplied),
            netAmountToPay: money(item.netAmountToPay),
            startupBusinessName: item.startup?.businessName || null,
            supplierCompanyName: item.supplier?.companyName || null,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/orders/:id", validate(supplierIdSchema, "params"), async (req, res, next) => {
    try {
      const item = await prisma.order.findUnique({
        where: { id: req.validatedParams.id },
        select: {
          id: true,
          startupId: true,
          supplierId: true,
          voucherId: true,
          grossAmount: true,
          discountApplied: true,
          netAmountToPay: true,
          status: true,
          waybillCode: true,
          createdAt: true,
          dispatchedAt: true,
          arrivedAt: true,
          clearedAt: true,
          startup: { select: { businessName: true } },
          supplier: { select: { companyName: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              product: { select: { id: true, name: true } },
            },
          },
          handshakes: {
            orderBy: { attemptedAt: "desc" },
            select: { id: true, success: true, message: true, attemptedAt: true },
          },
          escrowTransactions: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              direction: true,
              amount: true,
              status: true,
              description: true,
              createdAt: true,
            },
          },
        },
      });
      if (!item) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      return res.json({
        success: true,
        data: {
          ...item,
          grossAmount: money(item.grossAmount),
          discountApplied: money(item.discountApplied),
          netAmountToPay: money(item.netAmountToPay),
          startupBusinessName: item.startup?.businessName || null,
          supplierCompanyName: item.supplier?.companyName || null,
          items: item.items.map((orderItem) => ({
            ...orderItem,
            unitPrice: money(orderItem.unitPrice),
            lineTotal: money(orderItem.lineTotal),
          })),
          escrowTransactions: item.escrowTransactions.map((transaction) => ({
            ...transaction,
            amount: money(transaction.amount),
          })),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/escrow-summary", async (req, res, next) => {
    try {
      const [transactionGroups, pending, cancelled, recentTransactions] = await Promise.all([
        prisma.escrowTransaction.groupBy({
          by: ["direction"],
          where: { status: "SUCCESS" },
          _sum: { amount: true },
        }),
        prisma.order.aggregate({
          where: { status: "DELIVERED_PENDING_HANDSHAKE" },
          _sum: { netAmountToPay: true },
        }),
        prisma.order.aggregate({
          where: { status: "CANCELLED" },
          _sum: { netAmountToPay: true },
        }),
        prisma.escrowTransaction.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderId: true,
            direction: true,
            amount: true,
            status: true,
            description: true,
            createdAt: true,
          },
        }),
      ]);
      const totals = new Map(transactionGroups.map((group) => [
        group.direction,
        group._sum.amount,
      ]));
      return res.json({
        success: true,
        data: {
          totalEscrowCommitted: money(totals.get("DEBIT")),
          totalEscrowCleared: money(totals.get("CREDIT")),
          totalPendingHandshake: money(pending._sum.netAmountToPay),
          totalCancelled: money(cancelled._sum.netAmountToPay),
          recentTransactions: recentTransactions.map((item) => ({
            ...item,
            amount: money(item.amount),
          })),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createOperationsRouter };

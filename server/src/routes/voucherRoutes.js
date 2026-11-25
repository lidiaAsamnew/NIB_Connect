const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorizePermission } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validate");
const { recordAuditLog } = require("../services/auditService");
const { createVoucherSchema, paginationSchema } = require("../validators/voucher.validator");

function createVoucherRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));

  router.post(
    "/",
    authorizePermission("vouchers", "create"),
    validate(createVoucherSchema),
    async (req, res, next) => {
      const { recipientUserId, amount } = req.validatedBody;
      try {
        const voucher = await prisma.$transaction(async (transaction) => {
          const recipient = await transaction.user.findUnique({
            where: { id: recipientUserId },
            select: { id: true, role: true, isActive: true },
          });
          if (
            !recipient ||
            !recipient.isActive ||
            recipient.role !== "WOMEN_STARTUP_OWNER"
          ) {
            return null;
          }

          const createdVoucher = await transaction.voucher.create({
            data: {
              recipientUserId: recipient.id,
              allocatedByUserId: req.user.id,
              amount,
              status: "ACTIVE",
            },
            select: {
              id: true,
              recipientUserId: true,
              allocatedByUserId: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          });
          await recordAuditLog(transaction, {
            actorId: req.user.id,
            action: "VOUCHER_ALLOCATED",
            entityType: "VOUCHER",
            entityId: createdVoucher.id,
            metadata: { recipientUserId: recipient.id, amount },
          });
          await transaction.notification.create({
            data: {
              userId: recipient.id,
              title: "Voucher allocated",
              message: `A voucher of ${Number(amount).toFixed(2)} has been allocated to your account.`,
              type: "VOUCHER_ALLOCATED",
              link: "/me",
              relatedEntityId: createdVoucher.id,
            },
          });
          return createdVoucher;
        });

        if (!voucher) {
          return res.status(404).json({
            success: false,
            message: "Active startup owner not found.",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Voucher allocated.",
          data: voucher,
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.get(
    "/mine",
    authorizePermission("vouchers", "readOwn"),
    validate(paginationSchema, "query"),
    async (req, res, next) => {
      const { page, limit } = req.validatedQuery;
      const where = { recipientUserId: req.user.id };
      try {
        const [items, total] = await Promise.all([
          prisma.voucher.findMany({
            where,
            select: { id: true, amount: true, status: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.voucher.count({ where }),
        ]);
        return res.json({ success: true, data: { items, total, page, limit } });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.get(
    "/summary",
    authorizePermission("vouchers", "readSummary"),
    async (req, res, next) => {
      try {
        const totals = await prisma.voucher.groupBy({
          by: ["status"],
          _sum: { amount: true },
          _count: { _all: true },
        });
        return res.json({ success: true, data: { totals } });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.get(
    "/",
    authorizePermission("vouchers", "readAll"),
    validate(paginationSchema, "query"),
    async (req, res, next) => {
      const { page, limit } = req.validatedQuery;
      try {
        const [items, total] = await Promise.all([
          prisma.voucher.findMany({
            select: {
              id: true,
              recipientUserId: true,
              allocatedByUserId: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.voucher.count(),
        ]);
        return res.json({ success: true, data: { items, total, page, limit } });
      } catch (error) {
        return next(error);
      }
    },
  );

  return router;
}

module.exports = { createVoucherRouter };

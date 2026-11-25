const express = require("express");
const { authorizePermission } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validate");
const { recordAuditLog } = require("../services/auditService");
const { userIdSchema, userListSchema } = require("../validators/userManagement.validator");

const userListFields = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

function createUserManagementRouter({ prisma }) {
  const router = express.Router();

  router.get(
    "/",
    authorizePermission("userManagement", "read"),
    validate(userListSchema, "query"),
    async (req, res, next) => {
      const { search, role, status, page, limit } = req.validatedQuery;
      const where = {
        ...(role ? { role } : {}),
        ...(status ? { isActive: status === "active" } : {}),
        ...(search ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        } : {}),
      };

      try {
        const [items, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: userListFields,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.user.count({ where }),
        ]);
        return res.json({
          success: true,
          data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.get(
    "/:id",
    authorizePermission("userManagement", "read"),
    validate(userIdSchema, "params"),
    async (req, res, next) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.validatedParams.id },
          select: {
            ...userListFields,
            startupProfile: { select: { businessName: true } },
            supplierProfile: {
              select: {
                companyName: true,
                isVerified: true,
              },
            },
          },
        });
        if (!user) {
          return res.status(404).json({ success: false, message: "User not found." });
        }
        return res.json({ success: true, data: user });
      } catch (error) {
        return next(error);
      }
    },
  );

  async function setActiveStatus(req, res, next, isActive) {
    const { id } = req.validatedParams;
    if (!isActive && id === req.user.id) {
      return res.status(409).json({
        success: false,
        message: "You cannot deactivate your own operator account.",
      });
    }

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.findUnique({
          where: { id },
          select: { id: true, isActive: true },
        });
        if (!user) return { notFound: true };
        if (user.isActive === isActive) {
          return { userId: user.id, isActive, unchanged: true };
        }

        const updated = await transaction.user.updateMany({
          where: { id: user.id, isActive: user.isActive },
          data: { isActive },
        });
        if (updated.count !== 1) return { conflict: true };

        const auditLog = await recordAuditLog(transaction, {
          actorId: req.user.id,
          action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          entityType: "USER",
          entityId: user.id,
          metadata: { isActive },
        });
        if (!isActive) {
          await transaction.notification.create({
            data: {
              userId: user.id,
              title: "Account deactivated",
              message: "Your account has been deactivated. Contact NIB operations for assistance.",
              type: "ACCOUNT_DEACTIVATED",
              relatedEntityId: auditLog.id,
            },
          });
        }
        return { userId: user.id, isActive, auditLogId: auditLog.id };
      });

      if (result.notFound) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
      if (result.conflict) {
        return res.status(409).json({
          success: false,
          message: "User status changed before this request completed. Refresh and try again.",
        });
      }
      const message = result.unchanged
        ? `User is already ${isActive ? "active" : "deactivated"}.`
        : `User ${isActive ? "activated" : "deactivated"} successfully.`;
      return res.json({
        success: true,
        message,
        data: {
          userId: result.userId,
          isActive: result.isActive,
          auditLogId: result.auditLogId || null,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  router.patch(
    "/:id/deactivate",
    authorizePermission("userManagement", "manage"),
    validate(userIdSchema, "params"),
    (req, res, next) => setActiveStatus(req, res, next, false),
  );
  router.patch(
    "/:id/activate",
    authorizePermission("userManagement", "manage"),
    validate(userIdSchema, "params"),
    (req, res, next) => setActiveStatus(req, res, next, true),
  );

  return router;
}

module.exports = { createUserManagementRouter };

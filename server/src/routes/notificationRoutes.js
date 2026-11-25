const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorizePermission } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validate");
const {
  notificationIdSchema,
  notificationQuerySchema,
} = require("../validators/notification.validator");

function createNotificationRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));

  router.get(
    "/",
    authorizePermission("notifications", "readOwn"),
    validate(notificationQuerySchema, "query"),
    async (req, res, next) => {
      const { type, unreadOnly, page, limit } = req.validatedQuery;
      const where = {
        userId: req.user.id,
        ...(type ? { type } : {}),
        ...(unreadOnly ? { isRead: false } : {}),
      };
      try {
        const [items, total, unreadCount] = await Promise.all([
          prisma.notification.findMany({
            where,
            select: {
              id: true,
              title: true,
              message: true,
              type: true,
              isRead: true,
              link: true,
              relatedEntityId: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.notification.count({ where }),
          prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
        ]);
        return res.json({
          success: true,
          data: { items, total, unreadCount, page, limit },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.patch(
    "/read-all",
    authorizePermission("notifications", "updateOwn"),
    async (req, res, next) => {
      try {
        const result = await prisma.notification.updateMany({
          where: { userId: req.user.id, isRead: false },
          data: { isRead: true },
        });
        return res.json({
          success: true,
          message: "All notifications marked as read.",
          data: { updatedCount: result.count },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.patch(
    "/:id/read",
    authorizePermission("notifications", "updateOwn"),
    validate(notificationIdSchema, "params"),
    async (req, res, next) => {
      try {
        const result = await prisma.notification.updateMany({
          where: { id: req.validatedParams.id, userId: req.user.id },
          data: { isRead: true },
        });
        if (result.count === 0) {
          const item = await prisma.notification.findFirst({
            where: { id: req.validatedParams.id, userId: req.user.id },
            select: { id: true, isRead: true },
          });
          if (!item) {
            return res.status(404).json({ success: false, message: "Notification not found." });
          }
        }
        return res.json({
          success: true,
          message: "Notification marked as read.",
          data: { id: req.validatedParams.id, isRead: true },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  return router;
}

module.exports = { createNotificationRouter };

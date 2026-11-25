const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorizePermission } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validate");
const { dateRangeFilter } = require("../utils/dateRange");
const { redactSensitiveMetadata } = require("../utils/securityMetadata");
const { securityEventQuerySchema } = require("../validators/audit.validator");

function createSecurityEventRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));
  router.use(authorizePermission("securityEvents", "read"));

  router.get("/", validate(securityEventQuerySchema, "query"), async (req, res, next) => {
    const { eventType, userId, orderId, ipAddress, from, to, page, limit } = req.validatedQuery;
    const where = {
      ...(eventType ? { eventType } : {}),
      ...(userId ? { userId } : {}),
      ...(orderId ? { orderId } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      ...dateRangeFilter(from, to),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.securityEvent.findMany({
          where,
          select: {
            id: true,
            userId: true,
            orderId: true,
            ipAddress: true,
            eventType: true,
            message: true,
            metadata: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.securityEvent.count({ where }),
      ]);
      return res.json({
        success: true,
        data: {
          items: items.map((item) => ({
            ...item,
            metadata: redactSensitiveMetadata(item.metadata),
          })),
          total,
          page,
          limit,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createSecurityEventRouter };

const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validate");
const { authorizePermission } = require("../middlewares/roleGuard");
const { auditQuerySchema, idParamsSchema } = require("../validators/audit.validator");
const { dateRangeFilter } = require("../utils/dateRange");

const auditFields = {
  id: true,
  actorId: true,
  action: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
  actor: { select: { id: true, fullName: true, email: true } },
};

function createAuditRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));
  router.use(authorizePermission("auditLogs", "read"));

  router.get("/", validate(auditQuerySchema, "query"), async (req, res, next) => {
    const { action, entityType, entityId, actor, from, to, page, limit } = req.validatedQuery;
    const where = {
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actor ? {
        actor: {
          is: {
            OR: [
              { fullName: { contains: actor } },
              { email: { contains: actor } },
            ],
          },
        },
      } : {}),
      ...dateRangeFilter(from, to),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          select: auditFields,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);
      return res.json({
        success: true,
        data: { items, total, page, limit },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", validate(idParamsSchema, "params"), async (req, res, next) => {
    try {
      const item = await prisma.auditLog.findUnique({
        where: { id: req.validatedParams.id },
        select: auditFields,
      });
      if (!item) {
        return res.status(404).json({ success: false, message: "Audit record not found." });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createAuditRouter };

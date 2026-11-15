const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorizePermission } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validate");
const { catalogQuerySchema } = require("../validators/operations.validator");

function createProductRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));
  router.use(authorizePermission("products", "readVerified"));

  router.get("/", validate(catalogQuerySchema, "query"), async (req, res, next) => {
    const { search, page, limit } = req.validatedQuery;
    const where = {
      isActive: true,
      supplier: { isVerified: true },
      ...(search ? { name: { contains: search } } : {}),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            price: true,
            stockQuantity: true,
            supplier: { select: { id: true, companyName: true } },
          },
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
      return res.json({
        success: true,
        data: {
          items: items.map((item) => ({
            ...item,
            price: item.price.toFixed(2),
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

  return router;
}

module.exports = { createProductRouter };

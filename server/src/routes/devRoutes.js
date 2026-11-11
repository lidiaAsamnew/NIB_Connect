import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// TEMPORARY dev helpers: never available in production
router.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found." });
  }
  next();
});

// Gives the tester page the users and products it needs for its dropdowns
router.get("/tester-data", async (req, res, next) => {
  try {
    const [users, products] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          role: true,
          startupProfile: { select: { id: true, businessName: true } },
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, price: true, stockQuantity: true },
        orderBy: { name: "asc" },
      }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        products: products.map((p) => ({ ...p, price: p.price.toFixed(2) })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
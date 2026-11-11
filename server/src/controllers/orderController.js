import { createOrder } from "../services/orderService.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";

function formatOrder(o) {
  return {
    id: o.id,
    status: o.status,
    startupId: o.startupId,
    supplierId: o.supplierId,
    voucherId: o.voucherId,
    grossAmount: o.grossAmount.toFixed(2),
    discountApplied: o.discountApplied.toFixed(2),
    netAmountToPay: o.netAmountToPay.toFixed(2),
    waybillCode: o.waybillCode,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toFixed(2),
      lineTotal: i.lineTotal.toFixed(2),
    })),
  };
}

// ---------- POST /api/orders ----------
export async function placeOrder(req, res, next) {
  try {
    const { voucherId, items } = req.body;

    if (!voucherId || typeof voucherId !== "string") {
      return res.status(400).json({ success: false, message: "voucherId is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items must be a non-empty list." });
    }

    const seen = new Set();
    for (const item of items) {
      if (!item || typeof item.productId !== "string") {
        return res.status(400).json({ success: false, message: "Each item needs a productId." });
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each quantity must be a whole number greater than zero.",
        });
      }
      if (seen.has(item.productId)) {
        return res.status(400).json({
          success: false,
          message: "Each product may appear only once. Combine the quantities.",
        });
      }
      seen.add(item.productId);
    }

    const order = await createOrder(req.user, { voucherId, items });

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: formatOrder(order),
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

// ---------- GET /api/orders/:id ----------
export async function getOrderById(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const { role, startupProfile, supplierProfile } = req.user;
    if (role === "WOMEN_STARTUP_OWNER" && order.startupId !== startupProfile?.id) {
      return res.status(403).json({ success: false, message: "You do not have access to this order." });
    }
    if (role === "TIER1_SUPPLIER" && order.supplierId !== supplierProfile?.id) {
      return res.status(403).json({ success: false, message: "You do not have access to this order." });
    }

    res.json({ success: true, data: formatOrder(order) });
  } catch (err) {
    next(err);
  }
}
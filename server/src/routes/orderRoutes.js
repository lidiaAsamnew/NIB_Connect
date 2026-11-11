import { Router } from "express";
import { authenticate, requireRole } from "../middleware/devAuth.js";
import { placeOrder, getOrderById } from "../controllers/orderController.js";

const router = Router();

// Only startup owners can place orders
router.post("/", authenticate, requireRole("WOMEN_STARTUP_OWNER"), placeOrder);

// One order: the owning startup, the order's supplier, operator, or EU officer
router.get(
  "/:id",
  authenticate,
  requireRole("WOMEN_STARTUP_OWNER", "TIER1_SUPPLIER", "NIB_SYSTEM_OPERATOR", "EU_COMPLIANCE_OFFICER"),
  getOrderById
);

export default router;
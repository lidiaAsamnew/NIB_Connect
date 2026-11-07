import { Router } from "express";
import { authenticate, requireRole } from "../middleware/devAuth.js";
import { placeOrder } from "../controllers/orderController.js";

const router = Router();

// Only startup owners can place orders
router.post("/", authenticate, requireRole("WOMEN_STARTUP_OWNER"), placeOrder);

export default router;
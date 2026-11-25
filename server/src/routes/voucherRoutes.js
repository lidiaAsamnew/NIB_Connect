import { Router } from "express";
import { authenticate, requireRole } from "../middleware/devAuth.js";
import {
  allocateVoucher,
  getAllVouchers,
  getMyVouchers,
  getVoucherById,
} from "../controllers/voucherController.js";

const router = Router();

// Only the NIB operator can allocate vouchers
router.post("/allocate", authenticate, requireRole("NIB_SYSTEM_OPERATOR"), allocateVoucher);

// Startup owner: her own vouchers (must be BEFORE "/:id")
router.get("/me", authenticate, requireRole("WOMEN_STARTUP_OWNER"), getMyVouchers);

// Operator and EU officer (read-only): all vouchers
router.get(
  "/",
  authenticate,
  requireRole("NIB_SYSTEM_OPERATOR", "EU_COMPLIANCE_OFFICER"),
  getAllVouchers
);

// One voucher: owner, operator, or EU officer (suppliers are blocked)
router.get(
  "/:id",
  authenticate,
  requireRole("WOMEN_STARTUP_OWNER", "NIB_SYSTEM_OPERATOR", "EU_COMPLIANCE_OFFICER"),
  getVoucherById
);

export default router;
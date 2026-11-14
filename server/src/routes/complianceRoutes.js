import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

import {
  complianceSummary,
  weeklyAllocationStream,
  sectorReport,
  regionReport,
  orderStatusReport,
  voucherStatusReport,
  escrowSummary,
  orders,
  vouchers,
  escrowTransactions,
} from "../controllers/complianceController.js";

const router = Router();

const complianceAccess = [
  authenticate,
  authorizeRoles("EU_COMPLIANCE_OFFICER", "NIB_SYSTEM_OPERATOR"),
];

router.get("/summary", ...complianceAccess, complianceSummary);
router.get("/weekly-allocation-stream", ...complianceAccess, weeklyAllocationStream);
router.get("/sector-report", ...complianceAccess, sectorReport);
router.get("/region-report", ...complianceAccess, regionReport);
router.get("/order-status-report", ...complianceAccess, orderStatusReport);
router.get("/voucher-status-report", ...complianceAccess, voucherStatusReport);
router.get("/escrow-summary", ...complianceAccess, escrowSummary);
router.get("/orders", ...complianceAccess, orders);
router.get("/vouchers", ...complianceAccess, vouchers);
router.get("/escrow-transactions", ...complianceAccess, escrowTransactions);

export default router;
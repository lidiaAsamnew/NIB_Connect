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
  weeklySectorMicroDataPackage,
  downloadReportPackage,
  exportOrdersCsv,
  exportVouchersCsv,
  exportWeeklyAllocationStreamCsv,
  exportSectorSummaryCsv,
  exportRegionSummaryCsv,
  exportEscrowTransactionsCsv,
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
router.get("/report-package", ...complianceAccess, weeklySectorMicroDataPackage);
router.get("/report-package.zip", ...complianceAccess, downloadReportPackage);
router.get("/export/orders.csv", ...complianceAccess, exportOrdersCsv);
router.get("/export/vouchers.csv", ...complianceAccess, exportVouchersCsv);
router.get(
  "/export/weekly-allocation-stream.csv",
  ...complianceAccess,
  exportWeeklyAllocationStreamCsv
);
router.get("/export/sector-summary.csv", ...complianceAccess, exportSectorSummaryCsv);
router.get("/export/region-summary.csv", ...complianceAccess, exportRegionSummaryCsv);
router.get(
  "/export/escrow-transactions.csv",
  ...complianceAccess,
  exportEscrowTransactionsCsv
);

export default router;
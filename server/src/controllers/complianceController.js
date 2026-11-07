import {
  getComplianceSummary,
  getWeeklyAllocationStream,
  getSectorReport,
  getRegionReport,
  getOrderStatusReport,
  getVoucherStatusReport,
  getEscrowSummary,
} from "../services/reportingService.js";

function handleReport(service) {
  return async (req, res, next) => {
    try {
      const data = await service(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

export const complianceSummary = handleReport(getComplianceSummary);
export const weeklyAllocationStream = handleReport(getWeeklyAllocationStream);
export const sectorReport = handleReport(getSectorReport);
export const regionReport = handleReport(getRegionReport);
export const orderStatusReport = handleReport(getOrderStatusReport);
export const voucherStatusReport = handleReport(getVoucherStatusReport);
export const escrowSummary = handleReport(getEscrowSummary);
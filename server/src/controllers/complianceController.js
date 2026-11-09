import {
  getComplianceSummary,
  getWeeklyAllocationStream,
  getSectorReport,
  getRegionReport,
  getOrderStatusReport,
  getVoucherStatusReport,
  getEscrowSummary,
  getOrders,
  getVouchers,
  getEscrowTransactions,
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

function handlePaginatedReport(service) {
  return async (req, res, next) => {
    try {
      const { records, pagination } = await service(req.query);
      res.json({
        success: true,
        data: records,
        meta: { pagination },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const orders = handlePaginatedReport(getOrders);
export const vouchers = handlePaginatedReport(getVouchers);
export const escrowTransactions = handlePaginatedReport(getEscrowTransactions);
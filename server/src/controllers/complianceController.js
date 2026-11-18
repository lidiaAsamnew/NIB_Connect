import { createHash } from "node:crypto";
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
import { generateComplianceReportPackage } from "../services/reportPackageService.js";

export async function weeklySectorMicroDataPackage(req, res, next) {
  try {
    const filters = {};

    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;

    const data = await getWeeklyAllocationStream(filters);
    const generatedAt = new Date().toISOString();
    const checksum = createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");

    res.json({
      success: true,
      data: {
        packageType: "weekly-sector",
        generatedAt,
        generatedBy: req.user.role,
        filters,
        recordCount: data.length,
        checksum,
        data,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadReportPackage(req, res, next) {
  try {
    const { buffer, filename } = await generateComplianceReportPackage(req.query);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

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
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma.js";

const Decimal = Prisma.Decimal;
const VALID_STATUSES = ["ALLOCATED", "COMMITTED_TO_ORDER", "REDEEMED_AND_SETTLED", "EXPIRED", "CANCELLED"];

// Turns a database voucher into the JSON we send back (money as "50000.00")
function formatVoucher(v) {
  return {
    id: v.id,
    startupId: v.startupId,
    amount: v.amount.toFixed(2),
    status: v.status,
    expiresAt: v.expiresAt,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

// Reads ?page= and ?limit= safely (defaults: page 1, 10 per page, max 100)
function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

// Shared by the two list endpoints
async function listVouchers(where, query, res) {
  const { page, limit, skip } = parsePagination(query);

  const [total, vouchers] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  res.json({
    success: true,
    data: vouchers.map(formatVoucher),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ---------- POST /api/vouchers/allocate ----------
export async function allocateVoucher(req, res, next) {
  try {
    const { startupId, amount, expiresAt } = req.body;

    if (!startupId || typeof startupId !== "string") {
      return res.status(400).json({ success: false, message: "startupId is required." });
    }

    const amountText = String(amount ?? "").trim();
    if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
      return res.status(400).json({
        success: false,
        message: "amount must be a number with at most 2 decimal places.",
      });
    }
    const amountDecimal = new Decimal(amountText);
    if (amountDecimal.lte(0)) {
      return res.status(400).json({
        success: false,
        message: "amount must be greater than zero.",
      });
    }

    let expiryDate = null;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({ success: false, message: "expiresAt is not a valid date." });
      }
      if (expiryDate <= new Date()) {
        return res.status(400).json({ success: false, message: "expiresAt must be in the future." });
      }
    }

    const startup = await prisma.startupProfile.findUnique({
      where: { id: startupId },
      include: { user: true },
    });
    if (!startup) {
      return res.status(404).json({ success: false, message: "Startup not found." });
    }
    if (startup.user.role !== "WOMEN_STARTUP_OWNER") {
      return res.status(400).json({
        success: false,
        message: "Vouchers can only be allocated to a women startup owner.",
      });
    }

    const voucher = await prisma.voucher.create({
      data: {
        startupId: startup.id,
        amount: amountDecimal,
        status: "ALLOCATED",
        allocatedById: req.user.id,
        expiresAt: expiryDate,
      },
    });

    res.status(201).json({
      success: true,
      message: "Voucher allocated successfully.",
      data: {
        id: voucher.id,
        startupId: voucher.startupId,
        amount: voucher.amount.toFixed(2),
        status: voucher.status,
        expiresAt: voucher.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------- GET /api/vouchers  (operator / EU officer) ----------
export async function getAllVouchers(req, res, next) {
  try {
    const { status, startupId } = req.query;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    const where = {};
    if (status) where.status = status;
    if (startupId) where.startupId = String(startupId);

    await listVouchers(where, req.query, res);
  } catch (err) {
    next(err);
  }
}

// ---------- GET /api/vouchers/me  (startup owner) ----------
export async function getMyVouchers(req, res, next) {
  try {
    const startup = req.user.startupProfile;
    if (!startup) {
      return res.status(404).json({ success: false, message: "Startup profile not found." });
    }

    const { status } = req.query;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    // The startupId always comes from the logged-in user, never from the request
    const where = { startupId: startup.id };
    if (status) where.status = status;

    await listVouchers(where, req.query, res);
  } catch (err) {
    next(err);
  }
}

// ---------- GET /api/vouchers/:id ----------
export async function getVoucherById(req, res, next) {
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: req.params.id },
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found." });
    }

    // A startup owner may only see her own voucher
    if (req.user.role === "WOMEN_STARTUP_OWNER") {
      const myStartupId = req.user.startupProfile?.id;
      if (voucher.startupId !== myStartupId) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this voucher.",
        });
      }
    }

    res.json({ success: true, data: formatVoucher(voucher) });
  } catch (err) {
    next(err);
  }
}
import { prisma } from "../lib/prisma.js";

// TEMPORARY: replace with Student 4's real JWT authentication once merged.
// Reads the user id from the "x-user-id" header and attaches the user to req.user.
export async function authenticate(req, res, next) {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        success: false,
        message: "Temporary dev login is disabled in production.",
      });
    }

    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Send the x-user-id header (temporary dev login).",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { startupProfile: true, supplierProfile: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Usage: requireRole("NIB_SYSTEM_OPERATOR") or requireRole("A", "B")
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
}
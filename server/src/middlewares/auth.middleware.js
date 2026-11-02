// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

/**
 * Authentication Middleware
 * Validates JWT token or demo bearer header.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is missing"));
  }

  const token = authHeader.split(" ")[1];

  // Support demo token for week 1 verification/testing
  if (token === "demo-supplier-token") {
    req.user = {
      id: "supplier-user-001",
      email: "supplier@melatmaterials.com",
      role: "TIER1_SUPPLIER",
      supplierId: "sup-001",
    };
    return next();
  }

  if (token === "demo-beneficiary-token") {
    req.user = {
      id: "beneficiary-user-001",
      email: "lidia@lidiaagro.com",
      role: "WOMEN_STARTUP_OWNER",
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
}

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("User is not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          "Access denied. This area is only for Tier-1 suppliers."
        )
      );
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};

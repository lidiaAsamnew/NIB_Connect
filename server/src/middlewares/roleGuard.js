const { getAllowedRoles } = require("../constants/rbac");
const { USER_ROLES } = require("../constants/roles");
const { recordSecurityEvent } = require("../services/securityEventService");

function denyAccess(req, res, next, metadata) {
  return recordSecurityEvent(req.app.locals.prisma, {
    userId: req.user ? req.user.id : null,
    eventType: "AUTHORIZATION_DENIED",
    message: "An authenticated user attempted an unauthorized action.",
    metadata: {
      method: req.method,
      resource: req.baseUrl || "/",
      ...metadata,
    },
  }).then(() => res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
  })).catch(next);
}

function authorize(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error("At least one role must be allowed.");
  }
  if (allowedRoles.some((role) => !USER_ROLES.includes(role))) {
    throw new Error("An unknown role was provided to the role guard.");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid.",
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return denyAccess(req, res, next, { allowedRoles });
    }
    return next();
  };
}

function authorizePermission(resource, action) {
  const allowedRoles = getAllowedRoles(resource, action);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid.",
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return denyAccess(req, res, next, { resource, action });
    }
    return next();
  };
}

module.exports = { authorize, authorizePermission };

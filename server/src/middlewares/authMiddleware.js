const { verifyToken } = require("../utils/jwt");
const { recordSecurityEvent } = require("../services/securityEventService");

async function rejectAuthentication(req, res, next, prisma, reason) {
  try {
    await recordSecurityEvent(prisma, {
      eventType: "AUTHENTICATION_FAILED",
      message: "An authenticated request could not be verified.",
      metadata: {
        reason,
        method: req.method,
        resource: req.baseUrl || "/",
      },
    });
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing or invalid.",
    });
  } catch (error) {
    return next(error);
  }
}

function authenticate({ prisma, jwtSecret }) {
  return async (req, res, next) => {
    const authorization = req.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      return rejectAuthentication(req, res, next, prisma, "missing_or_malformed_token");
    }

    let decoded;
    try {
      decoded = verifyToken(match[1], jwtSecret);
    } catch (error) {
      return rejectAuthentication(req, res, next, prisma, "invalid_token");
    }

    if (!decoded || typeof decoded.sub !== "string") {
      return rejectAuthentication(req, res, next, prisma, "invalid_subject");
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user || !user.isActive) {
        return rejectAuthentication(req, res, next, prisma, "inactive_or_unknown_user");
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { authenticate };

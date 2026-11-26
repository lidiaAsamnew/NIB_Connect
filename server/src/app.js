const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { createAuthRouter } = require("./routes/authRoutes");
const { createAuditRouter } = require("./routes/auditRoutes");
const { createOperatorRouter } = require("./routes/operatorRoutes");
const { createOperationsRouter } = require("./routes/operationsRoutes");
const { createNotificationRouter } = require("./routes/notificationRoutes");
const { createProductRouter } = require("./routes/productRoutes");
const { createSecurityEventRouter } = require("./routes/securityEventRoutes");
const { createUserRouter } = require("./routes/userRoutes");
const { createVoucherRouter } = require("./routes/voucherRoutes");
const { recordSecurityEvent } = require("./services/securityEventService");

function createApp({ prisma, jwtSecret = process.env.JWT_SECRET, jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d" }) {
  if (!prisma) {
    throw new Error("A Prisma client must be provided to create the app.");
  }
  if (
    typeof jwtSecret !== "string" ||
    jwtSecret.length < 32 ||
    jwtSecret.startsWith("replace_with_")
  ) {
    throw new Error("JWT_SECRET must be a non-placeholder secret of at least 32 characters.");
  }

  const app = express();
  app.locals.prisma = prisma;
  const trustedProxyCidrs = (process.env.TRUSTED_PROXY_CIDRS || "")
    .split(",")
    .map((cidr) => cidr.trim())
    .filter(Boolean);
  if (trustedProxyCidrs.length > 0) {
    app.set("trust proxy", trustedProxyCidrs);
  }

  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  let parsedClientOrigin;
  try {
    parsedClientOrigin = new URL(clientOrigin);
  } catch (error) {
    throw new Error("CLIENT_ORIGIN must be a valid frontend origin.");
  }
  if (clientOrigin === "*" || parsedClientOrigin.origin !== clientOrigin) {
    throw new Error("CLIENT_ORIGIN must be one exact origin, without a path or wildcard.");
  }

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin: clientOrigin,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/", (req, res) => {
    res.json({ message: "NIB-Connect backend is running!" });
  });

  app.use("/api/auth", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: async (req, res, next, options) => {
      try {
        await recordSecurityEvent(prisma, {
          ipAddress: req.ip,
          eventType: "AUTH_RATE_LIMITED",
          message: "Authentication request rate limit was exceeded.",
          metadata: { method: req.method, path: req.path },
        });
        return res.status(options.statusCode).json(options.message);
      } catch (error) {
        return next(error);
      }
    },
    message: {
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    },
  }));
  app.use("/api/auth", createAuthRouter({ prisma, jwtSecret, jwtExpiresIn }));
  app.use("/api/users", createUserRouter({ prisma, jwtSecret }));
  app.use("/api/operator", createOperatorRouter({ prisma, jwtSecret }));
  app.use("/api/ops", createOperationsRouter({ prisma, jwtSecret }));
  app.use("/api/notifications", createNotificationRouter({ prisma, jwtSecret }));
  app.use("/api/products", createProductRouter({ prisma, jwtSecret }));
  app.use("/api/audit-logs", createAuditRouter({ prisma, jwtSecret }));
  app.use("/api/security-events", createSecurityEventRouter({ prisma, jwtSecret }));
  app.use("/api/vouchers", createVoucherRouter({ prisma, jwtSecret }));

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ success: false, message: "Request body must be valid JSON." });
    }
    if (process.env.NODE_ENV === "production") {
      console.error("Unhandled API error.");
    } else {
      console.error("Unhandled API error:", err);
    }
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  });

  return app;
}

module.exports = { createApp };

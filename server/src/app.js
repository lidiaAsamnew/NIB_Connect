const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { createAuthRouter } = require("./routes/authRoutes");
const { createOperatorRouter } = require("./routes/operatorRoutes");
const { createUserRouter } = require("./routes/userRoutes");

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
    methods: ["GET", "POST", "OPTIONS"],
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
    message: {
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    },
  }));
  app.use("/api/auth", createAuthRouter({ prisma, jwtSecret, jwtExpiresIn }));
  app.use("/api/users", createUserRouter({ prisma, jwtSecret }));
  app.use("/api/operator", createOperatorRouter({ prisma, jwtSecret }));

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ success: false, message: "Request body must be valid JSON." });
    }
    console.error("Unhandled API error:", err);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  });

  return app;
}

module.exports = { createApp };

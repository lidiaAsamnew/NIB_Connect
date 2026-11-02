// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config/env");

const healthRoutes = require("./routes/health.routes");
const supplierRoutes = require("./routes/supplier.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/error.middleware");

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [
      config.corsOrigin,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  }),
);

// 3. Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Rate Limiting (100 requests per 15 minutes in general, relaxed in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
    errors: [],
  },
});
app.use("/api", limiter);

// 5. Mount API Routes
app.use("/api/health", healthRoutes);
app.use("/api/supplier", supplierRoutes);

// Root greeting endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NIB-Connect API Gateway - Closed-Loop B2B Escrow Platform",
    healthEndpoint: "/api/health",
    supplierEndpoint: "/api/supplier",
  });
});

// 6. 404 Handler for undefined routes
app.use(notFoundHandler);

// 7. Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;

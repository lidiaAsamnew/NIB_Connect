// src/config/env.js
const dotenv = require("dotenv");
const path = require("path");

// Load .env from server root or server/src if present
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config(); // fallback to default lookup

const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret_dev",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  waybillSecret: process.env.WAYBILL_SECRET || "default_waybill_secret",
  nodeEnv: process.env.NODE_ENV || "development",
};

module.exports = config;

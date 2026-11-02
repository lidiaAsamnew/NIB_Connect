// src/server.js
const app = require("./app");
const config = require("./config/env");

const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` NIB-Connect Backend Server Started Successfully`);
  console.log(` Mode: ${config.nodeEnv}`);
  console.log(` Port: ${PORT}`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(` Supplier API: http://localhost:${PORT}/api/supplier/dashboard`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("NIB-Connect backend server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("NIB-Connect backend server closed.");
    process.exit(0);
  });
});

module.exports = server;

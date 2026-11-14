// src/controllers/health.controller.js

/**
 * Health check handler
 * GET /api/health
 */
function getHealth(req, res) {
  return res.status(200).json({
    success: true,
    message: "NIB-Connect backend is running",
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
};

// src/middlewares/error.middleware.js
const { ZodError } = require("zod");

/**
 * Centralized Global Error Handler
 * Returns standard blueprint response format:
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "errors": []
 * }
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON payload";
    errors = [{ message: err.message }];
  }

  // Handle unauthorized / JWT errors
  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or expired authorization token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authorization token has expired";
  }

  // Status mapping if error code is set but statusCode isn't standard
  if (![400, 401, 403, 404, 500].includes(statusCode)) {
    if (statusCode < 500 && statusCode >= 400) {
      // keep 4xx
    } else {
      statusCode = 500;
    }
  }

  // Log unexpected errors
  if (statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.url}:`, err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  });
}

/**
 * 404 Not Found middleware for undefined routes
 */
function notFoundHandler(req, res, next) {
  return res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    errors: [
      {
        message: "Endpoint not found on NIB-Connect server",
      },
    ],
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

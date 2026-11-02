// src/utils/errors.js

class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad Request", errors = []) {
    super(message, 400, errors);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", errors = []) {
    super(message, 401, errors);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", errors = []) {
    super(message, 403, errors);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", errors = []) {
    super(message, 404, errors);
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error", errors = []) {
    super(message, 500, errors);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
};

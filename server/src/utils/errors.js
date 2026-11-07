export class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", errors = []) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", errors = []) {
    super(message, 401, errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", errors = []) {
    super(message, 403, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", errors = []) {
    super(message, 404, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", errors = []) {
    super(message, 500, errors);
  }
}
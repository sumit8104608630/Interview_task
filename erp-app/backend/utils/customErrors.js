class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError { constructor(m='Bad Request') { super(m, 400); } }
class UnauthorizedError extends AppError { constructor(m='Unauthorized') { super(m, 401); } }
class ForbiddenError extends AppError { constructor(m='Forbidden') { super(m, 403); } }
class NotFoundError extends AppError { constructor(m='Not Found') { super(m, 404); } }
class ConflictError extends AppError { constructor(m='Conflict') { super(m, 409); } }

module.exports = { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError };

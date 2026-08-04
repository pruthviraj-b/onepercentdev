class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends ApiError { constructor(message = 'Validation failed', details) { super(message, 400, 'VALIDATION_ERROR', details); this.name = 'ValidationError'; } }
class AuthError extends ApiError { constructor(message = 'Authentication required') { super(message, 401, 'UNAUTHENTICATED'); this.name = 'AuthError'; } }
class DatabaseError extends ApiError { constructor(message = 'Database error', details) { super(message, 500, 'DATABASE_ERROR', details); this.name = 'DatabaseError'; } }
class StorageError extends ApiError { constructor(message = 'Storage error', details) { super(message, 500, 'STORAGE_ERROR', details); this.name = 'StorageError'; } }
class AIError extends ApiError { constructor(message = 'AI service error', details) { super(message, 502, 'AI_ERROR', details); this.name = 'AIError'; } }
class PaymentError extends ApiError { constructor(message = 'Payment error', details) { super(message, 502, 'PAYMENT_ERROR', details); this.name = 'PaymentError'; } }

module.exports = { ApiError, ValidationError, AuthError, DatabaseError, StorageError, AIError, PaymentError };

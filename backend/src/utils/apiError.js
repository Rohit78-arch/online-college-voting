class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - safe error message for API
   * @param {object} [details] - optional extra info (validation errors, etc.)
   */
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { ApiError };

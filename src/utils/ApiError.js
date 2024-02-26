class ApiError extends Error {
/**
Represents an error object with a specific status code, message, errors, and stack trace.
@class
@param {number} statusCode - The status code of the error.
@param {string} [message="Something went wrong"] - The error message.
@param {Array} [errors=[]] - An array of additional error details.
@param {string} [stack=""] - The stack trace of the error.
*/
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };

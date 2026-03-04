// Custom error classes
// 404 = Not Found
// 400 = Bad Request
// 500 = Internal Server Error
// 401 = Unauthorized
// 403 = Forbidden
// 404 = Not Found
// 405 = Method Not Allowed
// 406 = Not Acceptable
// 407 = Proxy Authentication Required
// 408 = Request Timeout

/*
 * AppError = a base class for all custom errors
 * statusCode = the HTTP status code to return
 * details = additional information about the error
 * isOperational = whether the error is operational (user error) or programmer error
 */
export class AppError extends Error {
  statusCode: number;
  details: object;
  isOperational: boolean;

  constructor(message: string, statusCode: number, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/*
 * NotFoundError = an error for when a resource is not found
 * resource = the resource that was not found. 
 * query = the query that was used to find the resource.
 * “query” is NOT a SQL query. It means: “What lookup criteria did we use?”
 * Example output:
 * "error": "User not found",
 * "details": {
 *   "resource": "User",
 *   "query": {
 *     "email": "someone@example.com"
 *   }
 * }
 */
export class NotFoundError extends AppError {
  constructor(resource: string, query: string) {
    super(`${resource} not found for`, 404, { resource, query });
  }
}

/*
 * QueryError = an error for when a query fails
 * message = the error message
 * details = additional information about the error
 */
export class QueryError extends AppError {
  constructor(message: string, details = {}) {
    super(message, 500, details);
  }
}

/*
 * ValidationError = an error for when a validation fails
 * message = the error message
 * details = additional information about the error
 */
export class ValidationError extends AppError {
  constructor(message: string, details = {}) {
    super(message, 400, details);
  }
}

/*
 * AlreadyExistsError = an error for when a resource already exists
 * message = the error message
 * details = additional information about the error
 */
export class AlreadyExistsError extends AppError {
  constructor(message: string, details = {}) {
    super(message, 400, details);
  }
}

/**
 * 
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details = {}) {
    super(message, 401, details);
  }
}


/**
 * 
 */
export class ForbiddenError extends AppError {
  constructor(message: string, details = {}) {
    super(message, 403, details);
  }
}
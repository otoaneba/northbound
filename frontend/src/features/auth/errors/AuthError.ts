export class AuthError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(
    message: string,
    code = 'AUTH_ERROR',
    options?: { cause?: unknown; status?: number },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AuthError';
    this.code = code;
    this.status = options?.status;
  }
}

function httpStatusToCode(status: number): string {
  if (status === 400) return 'VALIDATION';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status >= 500) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
}

/** Normalize unknown failures into {@link AuthError} while preserving `cause`. */
export function toAuthError(err: unknown): AuthError {
  if (err instanceof AuthError) return err;
  if (err instanceof Error) {
    return new AuthError(err.message, 'UNKNOWN', { cause: err });
  }
  return new AuthError('Something went wrong', 'UNKNOWN', { cause: err });
}

export function authErrorFromResponse(
  message: string,
  status: number,
  cause?: unknown,
): AuthError {
  return new AuthError(message, httpStatusToCode(status), { cause, status });
}

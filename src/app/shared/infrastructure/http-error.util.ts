import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a human-readable error message from Angular HTTP responses,
 * supporting Spring Boot RFC 9457 ProblemDetail payloads (`detail`, `title`,
 * `message`) as well as generic Error instances.
 */
export function extractHttpErrorMessage(
  err: unknown,
  fallback = 'An error occurred while communicating with the server.'
): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Could not connect to the server. Verify that the backend is running.';
    }

    const body = err.error;
    if (body && typeof body === 'object') {
      const detail =
        (typeof body.detail === 'string' && body.detail.trim()) ||
        (typeof body.message === 'string' && body.message.trim()) ||
        (typeof body.error === 'string' && body.error.trim());
      if (detail) {
        return detail;
      }
      if (typeof body.title === 'string' && body.title.trim()) {
        return body.title.trim();
      }
    } else if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }

    if (err.status === 401) {
      return 'Invalid credentials.';
    }
    if (err.status === 403) {
      return 'Your account requires email verification or lacks permission for this action.';
    }
    if (err.status === 404) {
      return 'Resource not found on the server.';
    }
    return fallback;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

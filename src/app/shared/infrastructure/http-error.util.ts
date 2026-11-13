import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a human-readable error message from Angular HTTP responses,
 * supporting Spring Boot RFC 9457 ProblemDetail payloads (`detail`, `title`,
 * `message`) as well as generic Error instances.
 */
export function extractHttpErrorMessage(
  err: unknown,
  fallback = 'Ocurrió un error al comunicarse con el servidor.'
): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté activo.';
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
      return 'Credenciales incorrectas.';
    }
    if (err.status === 403) {
      return 'Tu cuenta requiere verificación de correo o no tiene permisos para esta acción.';
    }
    if (err.status === 404) {
      return 'Recurso no disponible en el servidor.';
    }
    return fallback;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

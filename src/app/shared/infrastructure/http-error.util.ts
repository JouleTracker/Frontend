import { HttpErrorResponse } from '@angular/common/http';

interface FieldErrorItem {
  field?: string;
  message?: string;
  defaultMessage?: string;
}

/**
 * Extracts structured validation error messages from Spring Boot 400 Bad Request payloads
 * (supports `errors` map, `errors` array, `fieldErrors`, and `violations`).
 */
function extractValidationDetails(body: Record<string, unknown>): string | null {
  const candidates = [body['errors'], body['fieldErrors'], body['violations']];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (Array.isArray(candidate) && candidate.length > 0) {
      const messages = candidate
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            const entry = item as FieldErrorItem;
            const msg = (entry.message || entry.defaultMessage || '').trim();
            if (!msg) return '';
            return entry.field ? `${entry.field}: ${msg}` : msg;
          }
          return '';
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(' · ');
      }
    }

    if (typeof candidate === 'object' && !Array.isArray(candidate)) {
      const entries = Object.entries(candidate as Record<string, unknown>)
        .map(([field, value]) => {
          if (typeof value === 'string' && value.trim()) {
            return `${field}: ${value.trim()}`;
          }
          if (Array.isArray(value)) {
            const joined = value.filter((v): v is string => typeof v === 'string' && !!v.trim()).join(', ');
            return joined ? `${field}: ${joined}` : '';
          }
          return '';
        })
        .filter(Boolean);

      if (entries.length > 0) {
        return entries.join(' · ');
      }
    }
  }

  return null;
}

/**
 * Extracts a human-readable error message from Angular HTTP responses,
 * supporting Spring Boot RFC 9457 ProblemDetail payloads (`detail`, `title`,
 * `message`), field validation error maps/lists (`400 Bad Request`),
 * conflict errors (`409 Conflict`), and generic Error instances.
 */
export function extractHttpErrorMessage(
  err: unknown,
  fallback = 'Ocurrió un error al comunicarse con el servidor.'
): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.';
    }

    const body = err.error;
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      const validationDetails = extractValidationDetails(record);
      const detail =
        (typeof record['detail'] === 'string' && record['detail'].trim()) ||
        (typeof record['message'] === 'string' && record['message'].trim()) ||
        (typeof record['error'] === 'string' && record['error'].trim()) ||
        '';

      const isGenericDetail =
        !detail ||
        /^(invalid request content\.?|validation failed\.?|bad request\.?)$/i.test(detail);

      if (validationDetails) {
        return isGenericDetail ? validationDetails : `${detail}: ${validationDetails}`;
      }

      if (detail) {
        return detail;
      }

      if (typeof record['title'] === 'string' && record['title'].trim()) {
        return record['title'].trim();
      }
    } else if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }

    if (err.status === 400) {
      return 'Los datos enviados no son válidos. Revisa los campos e inténtalo nuevamente.';
    }
    if (err.status === 401) {
      return 'Correo o contraseña inválidos, o la sesión ha expirado.';
    }
    if (err.status === 403) {
      return 'Tu cuenta requiere verificación de correo o no tiene permisos para esta acción.';
    }
    if (err.status === 404) {
      return 'El recurso solicitado no se encontró en el servidor.';
    }
    if (err.status === 409) {
      return 'Ya existe un registro con estos datos (por ejemplo, este correo electrónico ya está registrado).';
    }
    return fallback;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

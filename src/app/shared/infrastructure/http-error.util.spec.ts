import { HttpErrorResponse } from '@angular/common/http';
import { extractHttpErrorMessage } from './http-error.util';

describe('extractHttpErrorMessage', () => {
  it('should extract field validation errors from 400 Bad Request map payloads', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: {
        detail: 'Invalid request content.',
        errors: {
          email: 'debe ser una dirección de correo válida',
          password: 'debe contener un carácter especial'
        }
      }
    });

    const msg = extractHttpErrorMessage(err);
    expect(msg).toContain('email: debe ser una dirección de correo válida');
    expect(msg).toContain('password: debe contener un carácter especial');
  });

  it('should extract detail from 409 Conflict ProblemDetail responses', () => {
    const err = new HttpErrorResponse({
      status: 409,
      error: { detail: 'El correo ya está en uso.' }
    });

    expect(extractHttpErrorMessage(err)).toBe('El correo ya está en uso.');
  });

  it('should return Spanish default message for 409 Conflict without body', () => {
    const err = new HttpErrorResponse({ status: 409, error: null });
    expect(extractHttpErrorMessage(err)).toContain('Ya existe');
  });

  it('should return Spanish network error message when status is 0', () => {
    const err = new HttpErrorResponse({ status: 0, error: null });
    expect(extractHttpErrorMessage(err)).toContain('No se pudo conectar con el servidor');
  });
});

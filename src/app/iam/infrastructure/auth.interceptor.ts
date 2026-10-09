import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IamStore } from '../application/iam.store';

/**
 * Interceptor funcional HTTP para adjuntar el token de autenticación
 * en los encabezados de las peticiones salientes.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const iamStore = inject(IamStore);
  const user = iamStore.currentUser();

  // Si existe usuario con token, clonamos la petición y agregamos la cabecera
  if (user?.token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${user.token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};

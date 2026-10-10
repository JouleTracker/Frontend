import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';

/** Permite acceso solo a usuarios con sesión activa y que no estén baneados */
export const iamGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  if (iamStore.isSignedIn() && !iamStore.isBanned()) {
    return true;
  }
  return router.parseUrl('/login');
};

/** Permite acceso solo a invitados (sin sesión) */
export const guestGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  if (!iamStore.isSignedIn()) {
    return true;
  }
  // Si ya tiene sesión, lo enviamos a su dashboard correspondiente
  return router.parseUrl(iamStore.isAdmin() ? '/admin' : '/inicio');
};

/** Permite acceso exclusivo a Administradores */
export const adminGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  if (iamStore.isAdmin()) {
    return true;
  }
  return router.parseUrl('/inicio');
};

/** Bloquea al Administrador de las vistas normales de usuario */
export const homeownerGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  if (iamStore.isAdmin()) {
    return router.parseUrl('/admin');
  }
  return true;
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';

export const iamGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  if (iamStore.isSignedIn()) {
    return true;
  }
  return router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  if (!iamStore.isSignedIn()) {
    return true;
  }
  return router.parseUrl('/inicio');
};

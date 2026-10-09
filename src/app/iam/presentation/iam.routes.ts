import { Routes } from '@angular/router';
import { guestGuard } from '../infrastructure/iam.guard';

export const iamRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/authentication-section/authentication-section').then(
        (m) => m.AuthenticationSectionComponent
      ),
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./views/sign-in-form/sign-in-form').then((m) => m.SignInFormComponent),
        title: 'JouleTracker - Iniciar sesión'
      },
      {
        path: 'registro',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./views/sign-up-form/sign-up-form').then((m) => m.SignUpFormComponent),
        title: 'JouleTracker - Crear cuenta'
      },
      {
        path: 'recuperar-contrasena',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./views/forgot-password-view/forgot-password-view.component').then(
            (m) => m.ForgotPasswordViewComponent
          ),
        title: 'JouleTracker - Recuperar contraseña'
      }
    ]
  }
];

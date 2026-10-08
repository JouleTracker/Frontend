import { Routes } from '@angular/router';

const loginView = () =>
  import('./views/login-view/login-view.component').then((m) => m.LoginViewComponent);

const registerView = () =>
  import('./views/register-view/register-view.component').then((m) => m.RegisterViewComponent);

const forgotPasswordView = () =>
  import('./views/forgot-password-view/forgot-password-view.component').then(
    (m) => m.ForgotPasswordViewComponent
  );

const verifyEmailView = () =>
  import('./views/verify-email-view/verify-email-view.component').then(
    (m) => m.VerifyEmailViewComponent
  );

const baseTitle = 'JouleTracker';

/**
 * Authentication routes for JouleTracker.
 *
 * These routes are rendered WITHOUT the main app layout (no sidebar).
 */
export const authRoutes: Routes = [
  { path: 'login', loadComponent: loginView, title: `${baseTitle} - Iniciar sesión` },
  { path: 'registro', loadComponent: registerView, title: `${baseTitle} - Crear cuenta` },
  {
    path: 'recuperar-contrasena',
    loadComponent: forgotPasswordView,
    title: `${baseTitle} - Recuperar contraseña`
  },
  {
    path: 'verificar-correo',
    loadComponent: verifyEmailView,
    title: `${baseTitle} - Verificar correo`
  }
];

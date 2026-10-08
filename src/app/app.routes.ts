import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/application/auth.guard';

const homeView = () =>
  import('./shared/presentation/views/home-view/home-view.component').then((m) => m.HomeViewComponent);

const consumptionRoutes = () =>
  import('./consumption/presentation/consumption.routes').then((m) => m.consumptionRoutes);

const blankPage = () =>
  import('./shared/presentation/views/blank-page/blank-page').then((m) => m.BlankPage);

const loginView = () =>
  import('./auth/presentation/views/login-view/login-view.component').then((m) => m.LoginViewComponent);

const registerView = () =>
  import('./auth/presentation/views/register-view/register-view.component').then((m) => m.RegisterViewComponent);

const forgotPasswordView = () =>
  import('./auth/presentation/views/forgot-password-view/forgot-password-view.component').then(
    (m) => m.ForgotPasswordViewComponent
  );

const verifyEmailView = () =>
  import('./auth/presentation/views/verify-email-view/verify-email-view.component').then(
    (m) => m.VerifyEmailViewComponent
  );

const baseTitle = 'JouleTracker';

/**
 * Root routing configuration for JouleTracker.
 *
 * Implements Domain-Driven Design (DDD) with lazy-loaded bounded context routes.
 * All routes render inside the Layout component — the sidebar is automatically
 * hidden on auth pages via the Layout's isAuthPage signal.
 */
export const routes: Routes = [
  // ── Auth routes (sidebar hidden by Layout) ───────
  { path: 'login', loadComponent: loginView, canActivate: [guestGuard], title: `${baseTitle} - Iniciar sesión` },
  { path: 'registro', loadComponent: registerView, canActivate: [guestGuard], title: `${baseTitle} - Crear cuenta` },
  {
    path: 'recuperar-contrasena',
    loadComponent: forgotPasswordView,
    canActivate: [guestGuard],
    title: `${baseTitle} - Recuperar contraseña`
  },
  {
    path: 'verificar-correo',
    loadComponent: verifyEmailView,
    title: `${baseTitle} - Verificar correo`
  },

  // ── App routes (protected, sidebar visible) ──────
  { path: 'inicio', loadComponent: homeView, canActivate: [authGuard], title: `${baseTitle} - Inicio` },
  { path: 'consumo', loadChildren: consumptionRoutes, canActivate: [authGuard] },
  { path: 'dispositivos', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Dispositivos` },
  { path: 'alertas', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Alertas` },
  { path: 'reportes', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Reportes` },
  { path: 'recomendaciones', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Recomendaciones` },
  { path: 'configuracion', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Configuración` },

  // ── Fallback ─────────────────────────────────────
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];

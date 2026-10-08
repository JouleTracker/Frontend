import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/application/auth.guard';

const homeView = () =>
  import('./shared/presentation/views/home-view/home-view.component').then((m) => m.HomeViewComponent);

const consumptionRoutes = () =>
  import('./consumption/presentation/consumption.routes').then((m) => m.consumptionRoutes);

const devicesRoutes = () =>
  import('./devices/presentation/devices.routes').then((m) => m.devicesRoutes);

const iotRoutes = () =>
  import('./iot/presentation/iot.routes').then((m) => m.iotRoutes);

const alertsRoutes = () =>
  import('./alerts/presentation/alerts.routes').then((m) => m.alertsRoutes);

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

// Vista de configuración (ajusta la ruta según la carpeta donde la guardaste)
const configurationView = () =>
  import('./settings/presentation/views/configuration-view/configuration-view.component').then(
    (m) => m.ConfigurationViewComponent
  );

const baseTitle = 'JouleTracker';

/**
 * Root routing configuration for JouleTracker.
 *
 * Implements Domain-Driven Design (DDD) with lazy-loaded bounded context routes.
 */
export const routes: Routes = [
  // ── Auth routes ───────
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

  // ── App routes ──────
  { path: 'inicio', loadComponent: homeView, canActivate: [authGuard], title: `${baseTitle} - Inicio` },
  { path: 'consumo', loadChildren: consumptionRoutes, canActivate: [authGuard] },
  { path: 'dispositivos', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Dispositivos` },
  { path: 'alertas', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Alertas` },
  { path: 'reportes', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Reportes` },
  { path: 'recomendaciones', loadComponent: blankPage, canActivate: [authGuard], title: `${baseTitle} - Recomendaciones` },
  { path: 'sensores', loadChildren: iotRoutes },
  { path: 'configuracion', loadComponent: configurationView, canActivate: [authGuard], title: `${baseTitle} - Configuración` },

  // ── Fallback ─────────────────────────────────────
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];

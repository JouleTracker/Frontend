import { Routes } from '@angular/router';
import { iamGuard, adminGuard, homeownerGuard } from './iam/infrastructure/iam.guard';

// ── Vistas del Homeowner ──
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

const recommendationsRoutes = () =>
  import('./recommendations/presentation/recommendations.routes').then((m) => m.recommendationsRoutes);

const reportsRoutes = () =>
  import('./reports/presentation/reports.routes').then((m) => m.reportsRoutes);

const configurationView = () =>
  import('./settings/presentation/views/configuration-view/configuration-view.component').then(
    (m) => m.ConfigurationViewComponent
  );

// ── Vista de Administración ──
const adminDashboardView = () =>
  import('./admin/presentation/views/admin-dashboard/admin-dashboard').then(
    (m) => m.AdminDashboardComponent
  );

const baseTitle = 'JouleTracker';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },

  // ── Módulo de Administración ──
  { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  {
    path: 'admin/usuarios',
    loadComponent: adminDashboardView,
    data: { tab: 'users' },
    canActivate: [iamGuard, adminGuard],
    title: `${baseTitle} - Gestión de Usuarios`
  },
  {
    path: 'admin/alertas',
    loadComponent: adminDashboardView,
    data: { tab: 'alert' },
    canActivate: [iamGuard, adminGuard],
    title: `${baseTitle} - Emitir Alertas`
  },
  {
    path: 'admin/recomendaciones',
    loadComponent: adminDashboardView,
    data: { tab: 'recommendation' },
    canActivate: [iamGuard, adminGuard],
    title: `${baseTitle} - Emitir Recomendaciones`
  },

  // ── Rutas Homeowner ──
  { path: 'inicio', loadComponent: homeView, canActivate: [iamGuard, homeownerGuard], title: `${baseTitle}Inicio` },
  { path: 'consumo', loadChildren: consumptionRoutes, canActivate: [iamGuard, homeownerGuard] },
  { path: 'dispositivos', loadChildren: devicesRoutes, canActivate: [iamGuard, homeownerGuard] },
  { path: 'sensores', loadChildren: iotRoutes, canActivate: [iamGuard, homeownerGuard] },
  { path: 'alertas', loadChildren: alertsRoutes, canActivate: [iamGuard, homeownerGuard] },
  { path: 'recomendaciones', loadChildren: recommendationsRoutes, canActivate: [iamGuard, homeownerGuard], title: `${baseTitle}Recomendaciones` },
  { path: 'recommendations', redirectTo: 'recomendaciones', pathMatch: 'full' },
  { path: 'reportes', loadChildren: reportsRoutes, canActivate: [iamGuard, homeownerGuard], title: `${baseTitle}Reportes` },
  { path: 'reports', redirectTo: 'reportes', pathMatch: 'full' },
  { path: 'configuracion', loadComponent: configurationView, canActivate: [iamGuard, homeownerGuard], title: `${baseTitle}Configuración` },

  // ── IAM ──
  {
    path: '',
    loadChildren: () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes)
  },

  { path: '**', redirectTo: 'inicio' }
];

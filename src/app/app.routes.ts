import { Routes } from '@angular/router';
import { iamGuard } from './iam/infrastructure/iam.guard';

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

// Función lazy para reportes
const reportsRoutes = () =>
  import('./reports/presentation/reports.routes').then((m) => m.reportsRoutes);

const configurationView = () =>
  import('./settings/presentation/views/configuration-view/configuration-view.component').then(
    (m) => m.ConfigurationViewComponent
  );

const baseTitle = 'JouleTracker';

export const routes: Routes = [
  // 1. Redirección raíz
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },

  // 2. Rutas protegidas
  { path: 'inicio', loadComponent: homeView, canActivate: [iamGuard], title: `${baseTitle} - Inicio` },
  { path: 'consumo', loadChildren: consumptionRoutes, canActivate: [iamGuard] },
  { path: 'dispositivos', loadChildren: devicesRoutes, canActivate: [iamGuard] },
  { path: 'sensores', loadChildren: iotRoutes, canActivate: [iamGuard] },
  { path: 'alertas', loadChildren: alertsRoutes, canActivate: [iamGuard] },

  // ── Recomendaciones ──
  { path: 'recomendaciones', loadChildren: recommendationsRoutes, canActivate: [iamGuard], title: `${baseTitle} - Recomendaciones` },
  { path: 'recommendations', redirectTo: 'recomendaciones', pathMatch: 'full' },

  // ── Reportes (Con lazy loader function) ──
  { path: 'reportes', loadChildren: reportsRoutes, canActivate: [iamGuard], title: `${baseTitle} - Reportes` },
  { path: 'reports', redirectTo: 'reportes', pathMatch: 'full' },

  // ── Configuración ──
  { path: 'configuracion', loadComponent: configurationView, canActivate: [iamGuard], title: `${baseTitle} - Configuración` },

  // 3. IAM
  {
    path: '',
    loadChildren: () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes)
  },

  // 4. Wildcard
  { path: '**', redirectTo: 'inicio' }
];

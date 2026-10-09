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

const blankPage = () =>
  import('./shared/presentation/views/blank-page/blank-page').then((m) => m.BlankPage);

const configurationView = () =>
  import('./settings/presentation/views/configuration-view/configuration-view.component').then(
    (m) => m.ConfigurationViewComponent
  );

const baseTitle = 'JouleTracker';

export const routes: Routes = [
  // 1. Redirección manda a /inicio
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },

  // 2. Rutas de la app (protegidas con iamGuard)
  { path: 'inicio', loadComponent: homeView, canActivate: [iamGuard], title: `${baseTitle} - Inicio` },
  { path: 'consumo', loadChildren: consumptionRoutes, canActivate: [iamGuard] },
  { path: 'dispositivos', loadChildren: devicesRoutes, canActivate: [iamGuard] },
  { path: 'sensores', loadChildren: iotRoutes, canActivate: [iamGuard] },
  { path: 'alertas', loadChildren: alertsRoutes, canActivate: [iamGuard] },
  { path: 'reportes', loadComponent: blankPage, canActivate: [iamGuard], title: `${baseTitle} - Reportes` },
  { path: 'recomendaciones', loadComponent: blankPage, canActivate: [iamGuard], title: `${baseTitle} - Recomendaciones` },
  { path: 'configuracion', loadComponent: configurationView, canActivate: [iamGuard], title: `${baseTitle} - Configuración` },

  // 3. Rutas de IAM (login, registro, recuperar-contrasena)
  {
    path: '',
    loadChildren: () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes)
  },

  // 4. Wildcard fallback: cualquier URL desconocida va a /inicio
  { path: '**', redirectTo: 'inicio' }
];

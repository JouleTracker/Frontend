import { Routes } from '@angular/router';

const homeView = () =>
  import('./shared/presentation/views/home-view/home-view.component').then((m) => m.HomeViewComponent);

const consumptionRoutes = () =>
  import('./consumption/presentation/consumption.routes').then((m) => m.consumptionRoutes);

/** Loads the device management view only when its route is opened. */
const devicesView = () =>
  import('./devices/presentation/views/devices-view/devices-view.component').then(
    (m) => m.DevicesViewComponent,
  );

/** Loads the full alerts view only when its route is opened. */
const alertsView = () =>
  import('./alerts/presentation/views/alerts-view/alerts-view.component').then(
    (m) => m.AlertsViewComponent,
  );

const blankPage = () =>
  import('./shared/presentation/views/blank-page/blank-page').then((m) => m.BlankPage);

const baseTitle = 'JouleTracker';

/**
 * Root routing configuration for JouleTracker.
 *
 * Implements Domain-Driven Design (DDD) with lazy-loaded bounded context routes.
 */
export const routes: Routes = [
  { path: 'inicio', loadComponent: homeView, title: `${baseTitle} - Inicio` },
  { path: 'consumo', loadChildren: consumptionRoutes },
  { path: 'dispositivos', loadComponent: devicesView, title: `${baseTitle} - Dispositivos` },
  { path: 'alertas', loadComponent: alertsView, title: `${baseTitle} - Alertas` },
  { path: 'reportes', loadComponent: blankPage, title: `${baseTitle} - Reportes` },
  { path: 'recomendaciones', loadComponent: blankPage, title: `${baseTitle} - Recomendaciones` },
  { path: 'configuracion', loadComponent: blankPage, title: `${baseTitle} - Configuración` },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];

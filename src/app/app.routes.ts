import { Routes } from '@angular/router';

const blankPage = () =>
  import('./shared/presentation/views/blank-page/blank-page').then((m) => m.BlankPage);

const baseTitle = 'JouleTracker';

/**
 * Root routing configuration for JouleTracker.
 *
 * Each route corresponds to an option in the fixed left sidebar:
 * - /inicio           -> Blank view (ready for Dashboard/Home implementation)
 * - /consumo          -> Blank view (ready for Consumption metrics implementation)
 * - /dispositivos      -> Blank view (ready for Devices management implementation)
 * - /alertas          -> Blank view (ready for Alerts implementation)
 * - /reports          -> Reports view (/reportes remains a redirect alias)
 * - /recommendations  -> Recommendations view (/recomendaciones remains a redirect alias)
 * - /configuracion    -> Blank view (ready for Settings implementation)
 */
export const routes: Routes = [
  { path: 'inicio', loadComponent: blankPage, title: `${baseTitle} - Inicio` },
  { path: 'consumo', loadComponent: blankPage, title: `${baseTitle} - Consumo` },
  { path: 'dispositivos', loadComponent: blankPage, title: `${baseTitle} - Dispositivos` },
  { path: 'alertas', loadComponent: blankPage, title: `${baseTitle} - Alertas` },
  { path: 'reports', loadComponent: () => import('./reports/presentation/views/reports/reports').then(m => m.Reports), title: `${baseTitle} - Reportes` },
  { path: 'recommendations', loadComponent: () => import('./recommendations/presentation/views/recommendations/recommendations').then(m => m.Recommendations), title: `${baseTitle} - Recomendaciones` },
  { path: 'reportes', redirectTo: 'reports', pathMatch: 'full' },
  { path: 'recomendaciones', redirectTo: 'recommendations', pathMatch: 'full' },
  { path: 'configuracion', loadComponent: blankPage, title: `${baseTitle} - Configuración` },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];

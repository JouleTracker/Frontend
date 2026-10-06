import { Routes } from '@angular/router';

export const alertsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/alerts-view/alerts-view.component').then((m) => m.AlertsViewComponent),
    title: 'JouleTracker - Alertas'
  }
];

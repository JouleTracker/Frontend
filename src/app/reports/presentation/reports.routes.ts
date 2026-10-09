import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/reports/reports-view').then((m) => m.ReportsViewComponent)
  }
];

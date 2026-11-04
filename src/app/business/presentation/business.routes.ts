import { Routes } from '@angular/router';

export const businessRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/areas-view/areas-view.component').then((m) => m.AreasViewComponent)
  }
];

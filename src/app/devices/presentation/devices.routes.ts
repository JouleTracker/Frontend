import { Routes } from '@angular/router';

export const devicesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/devices-view/devices-view.component').then((m) => m.DevicesViewComponent),
    title: 'JouleTracker - Dispositivos'
  }
];

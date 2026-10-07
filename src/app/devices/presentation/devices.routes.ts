import { Routes } from '@angular/router';

export const devicesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/devices-view/devices-view.component').then((m) => m.DevicesViewComponent),
    title: 'JouleTracker - Dispositivos'
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./views/device-form/device-form.component').then((m) => m.DeviceFormComponent),
    title: 'JouleTracker - Registrar Dispositivo'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/device-form/device-form.component').then((m) => m.DeviceFormComponent),
    title: 'JouleTracker - Editar Dispositivo'
  }
];

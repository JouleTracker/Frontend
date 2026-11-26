import { Routes } from '@angular/router';

export const devicesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/devices-view/devices-view.component').then((m) => m.DevicesViewComponent),
    title: 'ROUTES.DEVICES'
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./views/device-form/device-form.component').then((m) => m.DeviceFormComponent),
    title: 'ROUTES.DEVICE_ADD'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/device-form/device-form.component').then((m) => m.DeviceFormComponent),
    title: 'ROUTES.DEVICE_EDIT'
  }
];

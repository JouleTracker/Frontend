import { Routes } from '@angular/router';

export const iotRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/sensors-view/sensors-view.component').then((m) => m.SensorsViewComponent),
    title: 'ROUTES.SENSORS'
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./views/sensor-form/sensor-form.component').then((m) => m.SensorFormComponent),
    title: 'ROUTES.SENSOR_ADD'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/sensor-form/sensor-form.component').then((m) => m.SensorFormComponent),
    title: 'ROUTES.SENSOR_EDIT'
  }
];

import { Routes } from '@angular/router';

export const iotRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/sensors-view/sensors-view.component').then((m) => m.SensorsViewComponent),
    title: 'JouleTracker - Sensores IoT'
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./views/sensor-form/sensor-form.component').then((m) => m.SensorFormComponent),
    title: 'JouleTracker - Agregar Sensor'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/sensor-form/sensor-form.component').then((m) => m.SensorFormComponent),
    title: 'JouleTracker - Configurar Sensor'
  }
];

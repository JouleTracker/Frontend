import { Routes } from '@angular/router';
import { ConsumptionViewComponent } from './views/consumption-view/consumption-view.component';

export const consumptionRoutes: Routes = [
  {
    path: '',
    component: ConsumptionViewComponent,
    title: 'JouleTracker - Consumo'
  }
];

import { Routes } from '@angular/router';

export const recommendationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/recommendations-view/recommendations-view').then(
        (m) => m.RecommendationsViewComponent
      )
  }
];

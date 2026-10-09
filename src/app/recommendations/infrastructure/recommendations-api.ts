import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { RecommendationItem } from '../domain/model/recommendation.entity';
import { RecommendationResource } from './recommendations-response';
import { environment } from '../../../environments/environment';
import { IamStore } from '../../iam/application/iam.store';

@Injectable({ providedIn: 'root' })
export class RecommendationsApi {
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Obtiene las recomendaciones del usuario autenticado (filtro por userId en db.json).
   */
  getRecommendations(): Observable<RecommendationItem[]> {
    const userId = this.iamStore.currentUserId();
    const query = userId ? `?userId=${userId}` : '';
    return this.http.get<RecommendationResource[]>(
      `${this.baseUrl}${environment.recommendationsEndpointPath}${query}`
    ).pipe(
      map(resources => (resources ?? []).map(r => this.toItem(r)))
    );
  }

  private toItem(resource: RecommendationResource): RecommendationItem {
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      icon: resource.icon,
      category: resource.category,
      potentialSaving: resource.potentialSaving,
      actionUrl: resource.actionUrl
    };
  }
}

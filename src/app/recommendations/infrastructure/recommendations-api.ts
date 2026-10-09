import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RecommendationItem, RecommendationMetrics } from '../domain/model/recommendation.entity';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecommendationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getMetrics(): Observable<RecommendationMetrics> {
    return this.http.get<RecommendationMetrics>(`${this.baseUrl}/recommendations-metrics`);
  }

  getRecommendations(): Observable<RecommendationItem[]> {
    return this.http.get<RecommendationItem[]>(`${this.baseUrl}/recommendations`);
  }
}

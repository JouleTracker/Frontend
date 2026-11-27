import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';

import {
  CreateRecommendationPayload,
  RecommendationItem
} from '../domain/model/recommendation.entity';
import {
  CreateRecommendationRequest,
  RecommendationResource
} from './recommendations-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecommendationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly endpoint = `${this.baseUrl}${environment.recommendationsEndpointPath}`;

  getRecommendations(userId: number): Observable<RecommendationItem[]> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid userId to fetch recommendations'));
    }

    const params = new HttpParams().set('userId', userId.toString());

    return this.http
      .get<RecommendationResource[]>(this.endpoint, { params })
      .pipe(map((resources) => (resources ?? []).map((r) => this.toItem(r))));
  }

  createRecommendation(payload: CreateRecommendationPayload): Observable<RecommendationItem> {
    const body: CreateRecommendationRequest = {
      userId: payload.userId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      estimatedSavingKwh: payload.estimatedSavingKwh,
      estimatedSavingAmount: payload.estimatedSavingAmount,
      category: payload.category
    };

    return this.http
      .post<RecommendationResource>(this.endpoint, body)
      .pipe(map((resource) => this.toItem(resource)));
  }

  private toItem(resource: RecommendationResource): RecommendationItem {
    return {
      id: resource.id,
      userId: resource.userId,
      title: resource.title,
      description: resource.description,
      estimatedSavingKwh: resource.estimatedSavingKwh ?? 0,
      estimatedSavingAmount: resource.estimatedSavingAmount ?? 0,
      category: resource.category,
      completed: Boolean(resource.completed),
      createdAt: resource.createdAt
    };
  }
}

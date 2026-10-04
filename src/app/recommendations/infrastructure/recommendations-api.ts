import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { RecommendationResource } from './recommendation-response';
import { RecommendationAssembler } from './recommendation-assembler';
import { Recommendation } from '../domain/model/recommendation.entity';

@Injectable({
  providedIn: 'root'
})
export class RecommendationsApi extends BaseApi {
  private readonly assembler = new RecommendationAssembler();

  constructor(private http: HttpClient) {
    super();
  }

  getRecommendations(): Observable<Recommendation[]> {
    return this.http.get<RecommendationResource[]>(`${this.baseUrl}${environment.recommendationsEndpointPath}`).pipe(
      map(res => this.assembler.toEntities(res)),
      catchError(err => throwError(() => new Error('Error al cargar recomendaciones: ' + err.message)))
    );
  }
}

import { Injectable, signal } from '@angular/core';
import { RecommendationsApi } from '../infrastructure/recommendations-api';
import { Recommendation } from '../domain/model/recommendation.entity';

@Injectable({
  providedIn: 'root'
})
export class RecommendationsStore {
  private readonly recommendationsSignal = signal<Recommendation[]>([]);
  readonly recommendations = this.recommendationsSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  constructor(private api: RecommendationsApi) {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.loadingSignal.set(true);
    this.api.getRecommendations().subscribe({
      next: data => {
        this.recommendationsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      }
    });
  }
}

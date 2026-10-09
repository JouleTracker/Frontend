import { computed, inject, Injectable, signal } from '@angular/core';
import { RecommendationsApi } from '../infrastructure/recommendations-api';
import { RecommendationItem, RecommendationMetrics } from '../domain/model/recommendation.entity';

@Injectable({ providedIn: 'root' })
export class RecommendationsStore {
  private readonly api = inject(RecommendationsApi);

  private readonly _metrics = signal<RecommendationMetrics | null>(null);
  readonly metrics = this._metrics.asReadonly();

  private readonly _items = signal<RecommendationItem[]>([]);
  readonly selectedCategory = signal<string>('Todas');
  readonly selectedSort = signal<'impact' | 'name'>('impact');

  readonly filteredRecommendations = computed(() => {
    let result = [...this._items()];
    const category = this.selectedCategory();

    if (category !== 'Todas') {
      result = result.filter((item) => item.category === category);
    }

    if (this.selectedSort() === 'impact') {
      result.sort((a, b) => b.impactScore - a.impactScore);
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  });

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api.getMetrics().subscribe({
      next: (metrics) => this._metrics.set(metrics),
      error: () => console.warn('Error al cargar métricas de recomendaciones')
    });

    this.api.getRecommendations().subscribe({
      next: (items) => {
        this._items.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar las recomendaciones');
        this.isLoading.set(false);
      }
    });
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  setSort(sort: 'impact' | 'name'): void {
    this.selectedSort.set(sort);
  }
}

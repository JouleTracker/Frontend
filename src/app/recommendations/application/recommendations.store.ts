import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { RecommendationsApi } from '../infrastructure/recommendations-api';
import {
  CreateRecommendationPayload,
  RecommendationItem,
  RecommendationMetrics
} from '../domain/model/recommendation.entity';
import { IamStore } from '../../iam/application/iam.store';
import { EnergyCalculationService } from '../../shared/domain/model/energy-calculation.constants';

@Injectable({ providedIn: 'root' })
export class RecommendationsStore {
  private readonly api = inject(RecommendationsApi);
  private readonly iamStore = inject(IamStore);
  private readonly translate = inject(TranslateService);

  private readonly _items = signal<RecommendationItem[]>([]);
  readonly selectedCategory = signal<string>('Todas');
  readonly selectedSort = signal<'impact' | 'name'>('impact');

  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  /** Lista de recomendaciones obtenidas directamente desde el backend */
  readonly allRecommendations = computed<RecommendationItem[]>(() => this._items());

  /** Categorías dinámicas disponibles para el filtro */
  readonly availableCategories = computed<string[]>(() => {
    const set = new Set<string>();
    this._items().forEach((r) => {
      if (r.category) {
        set.add(r.category);
      }
    });
    return ['Todas', ...Array.from(set)];
  });

  readonly filteredRecommendations = computed<RecommendationItem[]>(() => {
    let result = [...this._items()];
    const category = this.selectedCategory();

    if (category !== 'Todas') {
      result = result.filter(
        (item) => this.normalizeText(item.category) === this.normalizeText(category)
      );
    }

    if (this.selectedSort() === 'impact') {
      result.sort(
        (a, b) =>
          b.estimatedSavingKwh - a.estimatedSavingKwh ||
          b.estimatedSavingAmount - a.estimatedSavingAmount
      );
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  });

  /** Métricas reales calculadas exclusivamente a partir de las recomendaciones del backend */
  readonly metrics = computed<RecommendationMetrics>(() => {
    const items = this._items();

    const totalEstimatedSavingKwh = Number(
      items.reduce((acc, item) => acc + (item.estimatedSavingKwh ?? 0), 0).toFixed(2)
    );
    const totalEstimatedSavingAmount = Number(
      items.reduce((acc, item) => acc + (item.estimatedSavingAmount ?? 0), 0).toFixed(2)
    );
    const activeCount = items.filter((item) => !item.completed).length;
    const completedCount = items.filter((item) => item.completed).length;

    return {
      totalEstimatedSavingKwh,
      totalEstimatedSavingAmount,
      potentialSavings: `S/ ${totalEstimatedSavingAmount.toFixed(2)}`,
      estimatedReduction: `${totalEstimatedSavingKwh.toFixed(1)} kWh`,
      co2Avoided: `${EnergyCalculationService.calculateAvoidedEmissions(totalEstimatedSavingKwh)} Kg`,
      activeCount,
      completedCount
    };
  });

  constructor() {
    effect(() => {
      const userId = this.iamStore.currentUserId();
      if (userId) {
        this.loadAll(userId);
      } else {
        this._items.set([]);
      }
    });
  }

  loadAll(targetUserId?: number): void {
    const userId = targetUserId ?? this.iamStore.currentUserId();
    if (!userId) {
      this._items.set([]);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api.getRecommendations(userId).subscribe({
      next: (items) => {
        this._items.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('RECOMMENDATIONS.LOAD_ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  async createRecommendation(payload: CreateRecommendationPayload): Promise<RecommendationItem | null> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const created = await firstValueFrom(this.api.createRecommendation(payload));
      const currentUserId = this.iamStore.currentUserId();
      if (currentUserId && created.userId === currentUserId) {
        this._items.update((prev) => [created, ...prev]);
      }
      this.isSubmitting.set(false);
      return created;
    } catch {
      this.errorMessage.set(this.translate.instant('RECOMMENDATIONS.CREATE_ERROR'));
      this.isSubmitting.set(false);
      return null;
    }
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  setSort(sort: 'impact' | 'name'): void {
    this.selectedSort.set(sort);
  }

  private normalizeText(text: string): string {
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}

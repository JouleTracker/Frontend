import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RecommendationsApi } from '../infrastructure/recommendations-api';
import { RecommendationItem, RecommendationMetrics } from '../domain/model/recommendation.entity';
import { IamStore } from '../../iam/application/iam.store';
import { ConsumptionStore } from '../../consumption/application/consumption.store';
import { EnergyCalculationService } from '../../shared/domain/model/energy-calculation.constants';

@Injectable({ providedIn: 'root' })
export class RecommendationsStore {
  private readonly api = inject(RecommendationsApi);
  private readonly iamStore = inject(IamStore);
  private readonly consumptionStore = inject(ConsumptionStore);

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
      result.sort((a, b) => this.parseSaving(b.potentialSaving) - this.parseSaving(a.potentialSaving));
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  });

  /**
   * Métricas derivadas únicamente de datos reales de db.json:
   * las recomendaciones del usuario y su resumen de consumo (ahorro mensual).
   */
  readonly metrics = computed<RecommendationMetrics>(() => {
    const items = this._items();
    const savedKwhMonthly = this.consumptionStore.summary()?.savedKwhMonthly ?? 0;
    const maxReduction = items.reduce(
      (max, item) => Math.max(max, this.parseSaving(item.potentialSaving)),
      0
    );
    return {
      potentialSavings: `S/ ${EnergyCalculationService.calculateCost(savedKwhMonthly).toFixed(2)}`,
      estimatedReduction: `${maxReduction}%`,
      co2Avoided: `${EnergyCalculationService.calculateAvoidedEmissions(savedKwhMonthly)} Kg`,
      activeCount: items.length
    };
  });

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    // Recarga las recomendaciones cuando cambia el usuario autenticado (datos propios por usuario)
    effect(() => {
      const userId = this.iamStore.currentUserId();
      if (userId) {
        this.loadAll();
      }
    });
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

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

  /** Interpreta un ahorro potencial real de db.json (ej. "15%" → 15) */
  private parseSaving(potentialSaving: string): number {
    const parsed = Number(String(potentialSaving).replace('%', '').trim());
    return isNaN(parsed) ? 0 : parsed;
  }
}

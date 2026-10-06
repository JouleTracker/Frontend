import { Injectable, computed, signal } from '@angular/core';
import { AlertsApi } from '../infrastructure/alerts-api';
import { Alert } from '../domain/model/alert.entity';
import { AlertSummary } from '../domain/model/alert-summary.entity';

@Injectable({
  providedIn: 'root'
})
export class AlertsStore {
  private readonly alertsSignal = signal<Alert[]>([]);
  readonly alerts = this.alertsSignal.asReadonly();

  private readonly summarySignal = signal<AlertSummary | null>(null);
  readonly summary = this.summarySignal.asReadonly();

  private readonly selectedCategorySignal = signal<string>('Todos');
  readonly selectedCategory = this.selectedCategorySignal.asReadonly();

  private readonly selectedSortSignal = signal<string>('recent');
  readonly selectedSort = this.selectedSortSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  // === COMPUTED SIGNALS (Cálculos dinámicos en tiempo real) ===

  /** Alertas filtradas según categoría y orden */
  readonly filteredAlerts = computed(() => {
    let result = [...this.alertsSignal()];
    const category = this.selectedCategorySignal();

    if (category !== 'Todos') {
      result = result.filter(
        a => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    return result;
  });

  /** Total real de alertas (calculado del dataset) */
  readonly totalCount = computed(() => {
    return this.alertsSignal().length;
  });

  /** Conteo real de alertas activas que requieren atención */
  readonly activeCount = computed(() => {
    return this.alertsSignal().filter(a => a.status === 'Activa').length;
  });

  /** Conteo real de alertas resueltas */
  readonly resolvedCount = computed(() => {
    return this.alertsSignal().filter(a => a.status === 'Resuelta').length;
  });

  /** Porcentaje de reducción respecto al período anterior */
  readonly reductionPercentage = computed(() => {
    return this.summarySignal()?.reductionPercentage ?? 25;
  });

  readonly reductionLabel = computed(() => {
    return this.summarySignal()?.reductionLabel ?? 'vs mes anterior';
  });

  constructor(private api: AlertsApi) {
    this.loadAll();
  }

  loadAll(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getAlerts().subscribe({
      next: data => {
        this.alertsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      }
    });

    this.api.getSummary().subscribe({
      next: summary => {
        this.summarySignal.set(summary);
      },
      error: err => {
        console.error('Error cargando métricas agregadas de alertas:', err);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategorySignal.set(category);
  }

  setSort(sort: string): void {
    this.selectedSortSignal.set(sort);
  }
}

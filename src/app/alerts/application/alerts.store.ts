import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { AlertsApi } from '../infrastructure/alerts-api';
import { Alert } from '../domain/model/alert.entity';
import { AlertSummary } from '../domain/model/alert-summary.entity';

@Injectable({
  providedIn: 'root'
})
export class AlertsStore implements OnDestroy {
  private readonly alertsSignal = signal<Alert[]>([]);
  readonly alerts = this.alertsSignal.asReadonly();

  private readonly criticalAlertsSignal = signal<Alert[]>([]);

  private readonly summarySignal = signal<AlertSummary | null>(null);
  readonly summary = this.summarySignal.asReadonly();

  private readonly selectedCategorySignal = signal<string>('Todos');
  readonly selectedCategory = this.selectedCategorySignal.asReadonly();

  private readonly selectedSortSignal = signal<string>('recent');
  readonly selectedSort = this.selectedSortSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly updatingIdSignal = signal<number | null>(null);
  readonly updatingId = this.updatingIdSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  readonly criticalOverloadAlerts = computed(() => {
    const merged = new Map<number, Alert>();
    for (const alert of this.criticalAlertsSignal()) {
      if (!alert.read && alert.status === 'Activa') {
        merged.set(alert.id, alert);
      }
    }
    for (const alert of this.alertsSignal()) {
      if (alert.isCritical) {
        merged.set(alert.id, alert);
      } else if (merged.has(alert.id) && (alert.read || alert.status !== 'Activa')) {
        merged.delete(alert.id);
      }
    }
    return Array.from(merged.values());
  });

  readonly hasCriticalOverload = computed(() => this.criticalOverloadAlerts().length > 0);
  readonly primaryOverloadAlert = computed(() => this.criticalOverloadAlerts()[0] ?? null);

  readonly filteredAlerts = computed(() => {
    let result = [...this.alertsSignal()];
    const category = this.selectedCategorySignal();
    const sort = this.selectedSortSignal();

    if (category !== 'Todos') {
      result = result.filter(
        a => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (sort === 'severity') {
      const weight: Record<string, number> = { critical: 0, error: 1, warning: 2, info: 3 };
      result.sort((a, b) => (weight[a.severity] ?? 9) - (weight[b.severity] ?? 9));
    } else if (sort === 'status') {
      const weight: Record<string, number> = { Activa: 0, 'Leída': 1, Resuelta: 2 };
      result.sort((a, b) => (weight[a.status] ?? 9) - (weight[b.status] ?? 9));
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  });

  readonly totalCount = computed(() => {
    return this.alertsSignal().length || (this.summarySignal()?.totalCount ?? 0);
  });

  readonly activeCount = computed(() => {
    const activeFromList = this.alertsSignal().filter(a => a.status === 'Activa').length;
    return this.alertsSignal().length > 0 ? activeFromList : (this.summarySignal()?.activeCount ?? 0);
  });

  readonly resolvedCount = computed(() => {
    const resolvedFromList = this.alertsSignal().filter(a => a.status === 'Resuelta' || a.status === 'Leída').length;
    return this.alertsSignal().length > 0 ? resolvedFromList : (this.summarySignal()?.resolvedCount ?? 0);
  });

  readonly reductionPercentage = computed(() => {
    return this.summarySignal()?.reductionPercentage ?? 25;
  });

  readonly reductionLabel = computed(() => {
    return this.summarySignal()?.reductionLabel ?? 'vs mes anterior';
  });

  constructor(private api: AlertsApi) {
    this.loadAll();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  startAutoRefresh(intervalMs: number = 30000): void {
    this.stopAutoRefresh();
    this.pollingHandle = setInterval(() => {
      this.refreshSilent();
    }, intervalMs);
  }

  stopAutoRefresh(): void {
    if (this.pollingHandle !== null) {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
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

    this.loadCriticalAlerts();
    this.loadSummary();
  }

  refreshSilent(): void {
    this.api.getAlerts().subscribe({
      next: data => this.alertsSignal.set(data),
      error: () => {}
    });
    this.loadCriticalAlerts();
    this.loadSummary();
  }

  loadCriticalAlerts(): void {
    this.api.getCriticalAlerts().subscribe({
      next: data => this.criticalAlertsSignal.set(data),
      error: () => {}
    });
  }

  loadSummary(): void {
    this.api.getSummary().subscribe({
      next: summary => this.summarySignal.set(summary),
      error: err => console.error('Error cargando métricas agregadas de alertas:', err)
    });
  }

  markAsRead(alertId: number): void {
    this.updatingIdSignal.set(alertId);
    this.api.markAsRead(alertId).subscribe({
      next: updated => {
        this.alertsSignal.update(list =>
          list.map(item => (item.id === alertId ? updated : item))
        );
        this.criticalAlertsSignal.update(list => list.filter(item => item.id !== alertId));
        this.updatingIdSignal.set(null);
        this.loadSummary();
      },
      error: err => {
        this.errorSignal.set(err.message);
        this.updatingIdSignal.set(null);
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
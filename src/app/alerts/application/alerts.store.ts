import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AlertsApi } from '../infrastructure/alerts-api';
import { Alert } from '../domain/model/alert.entity';
import { IamStore } from '../../iam/application/iam.store';

@Injectable({
  providedIn: 'root'
})
export class AlertsStore {
  private readonly alertsSignal = signal<Alert[]>([]);
  readonly alerts = this.alertsSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  // === COMPUTED SIGNALS (Métricas derivadas únicamente de los datos reales de db.json) ===

  /** Total real de alertas del usuario */
  readonly totalCount = computed(() => {
    return this.alertsSignal().length;
  });

  /** Alertas activas que requieren atención */
  readonly activeCount = computed(() => {
    return this.alertsSignal().filter(a => a.status === 'Activa').length;
  });

  /** Alertas leídas */
  readonly resolvedCount = computed(() => {
    return this.alertsSignal().filter(a => a.status === 'Leída').length;
  });

  constructor(private api: AlertsApi, iamStore: IamStore) {
    // Recarga las alertas cuando cambia el usuario autenticado (datos propios por usuario)
    effect(() => {
      const userId = iamStore.currentUserId();
      if (userId) {
        this.loadAll();
      }
    });
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
  }
}

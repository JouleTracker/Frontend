import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertsApi } from '../infrastructure/alerts-api';
import { Alert } from '../domain/model/alert.entity';
import { IamStore } from '../../iam/application/iam.store';
import { environment } from '../../../environments/environment';

interface SensorItem {
  id: number;
  userId: number;
  name: string;
  todayKwh: number;
  recommendedDailyKwh: number | null;
  assignedDeviceName?: string;
}

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

  readonly totalCount = computed(() => this.alertsSignal().length);
  readonly activeCount = computed(() => this.alertsSignal().filter(a => a.status === 'Activa').length);
  readonly resolvedCount = computed(() => this.alertsSignal().filter(a => a.status === 'Leída').length);

  private readonly http = inject(HttpClient);

  constructor(private api: AlertsApi, private iamStore: IamStore) {
    effect(() => {
      const userId = this.iamStore.currentUserId();
      if (userId) {
        this.loadAll();
      }
    });
  }

  loadAll(): void {
    const userId = this.iamStore.currentUserId();
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // 1. Cargar las alertas guardadas en la API
    this.api.getAlerts().subscribe({
      next: dbAlerts => {
        // 2. Consultar los sensores del usuario para evaluar excesos en tiempo real
        const sensorsEndpoint = `${environment.apiBaseUrl}/sensors?userId=${userId}`;
        this.http.get<SensorItem[]>(sensorsEndpoint).subscribe({
          next: sensors => {
            const dynamicSensorAlerts: Alert[] = [];

            // Detectar cualquier sensor que supere su límite recomendado
            sensors.forEach(sensor => {
              if (sensor.recommendedDailyKwh && sensor.todayKwh > sensor.recommendedDailyKwh) {
                dynamicSensorAlerts.push(
                  new Alert({
                    id: 9000 + sensor.id,
                    title: `Límite diario superado: ${sensor.name} `,
                    description: ` | El dispositivo ${sensor.assignedDeviceName ?? sensor.name} consumió ${sensor.todayKwh.toFixed(2)} kWh (Límite: ${sensor.recommendedDailyKwh.toFixed(2)} kWh/día).`,
                    timeAgo: 'Ahora',
                    severity: 'warning',
                    actionUrl: '/dispositivos'
                  })
                );
              }
            });

            // Combinar alertas dinámicas al inicio de la lista
            this.alertsSignal.set([...dynamicSensorAlerts, ...dbAlerts]);
            this.loadingSignal.set(false);
          },
          error: () => {
            // Si falla la consulta de sensores, al menos mostrar las alertas de la API
            this.alertsSignal.set(dbAlerts);
            this.loadingSignal.set(false);
          }
        });
      },
      error: err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      }
    });
  }
}

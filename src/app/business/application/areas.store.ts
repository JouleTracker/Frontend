import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AreasApi } from '../infrastructure/areas-api';
import { Area } from '../domain/model/area.entity';
import { AreaResource } from '../infrastructure/area-response';
import { DevicesStore } from '../../devices/application/devices.store';
import { SensorsStore } from '../../iot/application/sensors.store';
import { IamStore } from '../../iam/application/iam.store';
import { ELECTRICITY_TARIFF_PER_KWH } from '../../shared/domain/model/energy-calculation.constants';

export interface AreaMetrics {
  area: Area;
  deviceCount: number;
  onlineDeviceCount: number;
  currentPowerKw: number;
  todayKwh: number;
  todayCostSoles: number;
  hasDevices: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AreasStore {
  private readonly api = inject(AreasApi);
  private readonly devicesStore = inject(DevicesStore);
  private readonly sensorsStore = inject(SensorsStore);
  private readonly iamStore = inject(IamStore);

  private readonly _areas = signal<Area[]>([]);
  readonly areas = this._areas.asReadonly();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Vincula reactivamente cada área con los dispositivos físicos ubicados en ella
   * para calcular telemetría en tiempo real y consumo acumulado diario por zona (US-33).
   */
  readonly areasWithMetrics = computed<AreaMetrics[]>(() => {
    const areasList = this._areas();
    const allDevices = this.devicesStore.devices();

    return areasList.map((area) => {
      // Coincidencia por nombre de ubicación (ej. "Cocina", "Sala Principal", "Oficina")
      const areaNameNorm = area.name.trim().toLowerCase();
      const areaDevices = allDevices.filter((d) => {
        const locNorm = d.location.trim().toLowerCase();
        return locNorm.includes(areaNameNorm) || areaNameNorm.includes(locNorm);
      });

      const deviceCount = areaDevices.length;
      const onlineDeviceCount = areaDevices.filter((d) => d.status === 'En línea').length;
      const currentPowerKw = Number(
        areaDevices.reduce((sum, d) => sum + (d.currentPowerKw || 0), 0).toFixed(2)
      );
      const todayKwh = Number(
        areaDevices.reduce((sum, d) => sum + (d.todayKwh || 0), 0).toFixed(2)
      );
      const todayCostSoles = Number((todayKwh * ELECTRICITY_TARIFF_PER_KWH).toFixed(2));

      return {
        area,
        deviceCount,
        onlineDeviceCount,
        currentPowerKw,
        todayKwh,
        todayCostSoles,
        hasDevices: deviceCount > 0
      };
    });
  });

  /** Total de áreas registradas */
  readonly totalAreas = computed(() => this._areas().length);

  /** Potencia total en tiempo real de todas las áreas */
  readonly totalPowerKw = computed(() => {
    return Number(
      this.areasWithMetrics()
        .reduce((sum, m) => sum + m.currentPowerKw, 0)
        .toFixed(2)
    );
  });

  /** Consumo acumulado hoy entre todas las áreas */
  readonly totalTodayKwh = computed(() => {
    return Number(
      this.areasWithMetrics()
        .reduce((sum, m) => sum + m.todayKwh, 0)
        .toFixed(2)
    );
  });

  /** Costo total estimado del día */
  readonly totalTodayCostSoles = computed(() => {
    return Number((this.totalTodayKwh() * ELECTRICITY_TARIFF_PER_KWH).toFixed(2));
  });

  /** Área con mayor consumo energético hoy */
  readonly topConsumingArea = computed<AreaMetrics | null>(() => {
    const list = this.areasWithMetrics();
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.todayKwh - a.todayKwh)[0] || null;
  });

  constructor() {
    effect(() => {
      const userId = this.iamStore.currentUserId();
      if (userId) {
        this.loadAreas();
      }
    });
  }

  loadAreas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getAreas().subscribe({
      next: (areas) => {
        this._areas.set(areas);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  createArea(payload: Partial<AreaResource>): Observable<Area> {
    return this.api.createArea(payload).pipe(
      tap((newArea) => {
        this._areas.update((prev) => [...prev, newArea]);
      })
    );
  }

  updateArea(id: number, changes: Partial<AreaResource>): Observable<Area> {
    return this.api.updateArea(id, changes).pipe(
      tap((updated) => {
        this._areas.update((prev) => prev.map((a) => (a.id === id ? updated : a)));
      })
    );
  }

  deleteArea(id: number): Observable<void> {
    return this.api.deleteArea(id).pipe(
      tap(() => {
        this._areas.update((prev) => prev.filter((a) => a.id !== id));
      })
    );
  }
}

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { DevicesApi } from '../infrastructure/devices-api';
import { Device } from '../domain/model/device.entity';
import { DeviceSummary } from '../domain/model/device-summary.entity';
import { DeviceResource } from '../infrastructure/devices-response';
import { IamStore } from '../../iam/application/iam.store';
import { EnergyCalculationService } from '../../shared/domain/model/energy-calculation.constants';

@Injectable({
  providedIn: 'root'
})
export class DevicesStore {
  private readonly devicesSignal = signal<Device[]>([]);
  readonly devices = this.devicesSignal.asReadonly();

  private readonly summarySignal = signal<DeviceSummary | null>(null);
  readonly summary = this.summarySignal.asReadonly();

  private readonly searchTermSignal = signal<string>('');
  readonly searchTerm = this.searchTermSignal.asReadonly();

  private readonly selectedCategorySignal = signal<string>('Todos');
  readonly selectedCategory = this.selectedCategorySignal.asReadonly();

  private readonly selectedSortSignal = signal<string>('consumo-desc');
  readonly selectedSort = this.selectedSortSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private readonly iamStore = inject(IamStore);

  // === COMPUTED SIGNALS (Solo datos reales de db.json; sin valores inventados) ===

  /** Dispositivos filtrados por búsqueda y categoría, ordenados según criterio */
  readonly filteredDevices = computed(() => {
    let result = [...this.devicesSignal()];
    const term = this.searchTermSignal().trim().toLowerCase();
    const category = this.selectedCategorySignal();
    const sort = this.selectedSortSignal();

    // 1. Filtrado por texto (nombre o ubicación)
    if (term) {
      result = result.filter(
        d => d.name.toLowerCase().includes(term) || d.location.toLowerCase().includes(term)
      );
    }

    // 2. Filtrado por categoría
    if (category !== 'Todos') {
      result = result.filter(
        d => d.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 3. Ordenamiento
    if (sort === 'consumo-desc') {
      result.sort((a, b) => b.currentPowerKw - a.currentPowerKw);
    } else if (sort === 'consumo-asc') {
      result.sort((a, b) => a.currentPowerKw - b.currentPowerKw);
    } else if (sort === 'nombre') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  });

  /** Conteo de dispositivos conectados (desde el resumen real o la lista real) */
  readonly connectedDevices = computed(() => {
    const sum = this.summarySignal();
    if (sum) return sum.connectedDevices;
    return this.devicesSignal().filter(d => d.status === 'En línea').length;
  });

  /** Conteo de dispositivos en espera */
  readonly waitingDevices = computed(() => {
    const sum = this.summarySignal();
    if (sum) return sum.waitingDevices;
    return this.devicesSignal().filter(d => d.status === 'En espera').length;
  });

  /** Potencia total actual en kW */
  readonly totalPowerKw = computed(() => {
    const sum = this.summarySignal();
    if (sum) return sum.totalPowerKw;
    const total = this.devicesSignal().reduce((acc, d) => acc + d.currentPowerKw, 0);
    return Number(total.toFixed(2));
  });

  /** Etiqueta de variación vs ayer */
  readonly powerDiffVsYesterdayLabel = computed(() => {
    return this.summarySignal()?.powerDiffVsYesterdayLabel ?? '';
  });

  /**
   * Costo estimado del mes (S/): si db.json lo trae en `device-summaries` se usa ese valor;
   * si no, se proyecta desde el consumo diario real de los dispositivos (kWh hoy * 30 días * tarifa).
   */
  readonly estimatedCostSoles = computed(() => {
    const sum = this.summarySignal();
    if (sum && sum.estimatedCostSoles > 0) return sum.estimatedCostSoles;
    const dailyKwh = this.devicesSignal().reduce((acc, d) => acc + d.todayKwh, 0);
    return EnergyCalculationService.calculateCost(dailyKwh * 30);
  });

  /** Etiqueta de variación del costo vs mes anterior */
  readonly costDiffVsMonthLabel = computed(() => {
    return this.summarySignal()?.costDiffVsMonthLabel ?? '';
  });

  /** Emisiones evitadas de CO2 (kg) */
  readonly co2AvoidedKg = computed(() => {
    return this.summarySignal()?.co2AvoidedKg ?? 0;
  });

  /** Equivalencia ecológica en árboles */
  readonly treeEquivalence = computed(() => {
    return this.summarySignal()?.treeEquivalence ?? '';
  });

  // === LÍMITES DEL PLAN ===

  /** Límite de dispositivos según el plan (Starter 5, Plus 15, Pro ilimitado) */
  readonly deviceLimit = this.iamStore.deviceLimit;

  /** Dispositivos usados actualmente por el usuario */
  readonly deviceCount = computed(() => this.devicesSignal().length);

  /** Indica si el usuario puede registrar un dispositivo más */
  readonly canAddDevice = computed(() => this.deviceCount() < this.deviceLimit());

  constructor(private api: DevicesApi) {
    // Recarga los dispositivos cuando cambia el usuario autenticado (datos propios por usuario)
    effect(() => {
      const userId = this.iamStore.currentUserId();
      if (userId) {
        this.loadAll();
      }
    });
  }

  loadAll(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getDevices().subscribe({
      next: data => {
        this.devicesSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      }
    });

    this.api.getDeviceSummary().subscribe({
      next: summary => {
        this.summarySignal.set(summary);
      },
      error: err => {
        console.error('Error cargando métricas agregadas de dispositivos:', err);
      }
    });
  }

  setSearchTerm(term: string): void {
    this.searchTermSignal.set(term);
  }

  selectCategory(category: string): void {
    this.selectedCategorySignal.set(category);
  }

  setSort(sort: string): void {
    this.selectedSortSignal.set(sort);
  }

  getDeviceById(id: number): Device | undefined {
    return this.devicesSignal().find(d => d.id === id);
  }

  createDevice(newDevice: Partial<DeviceResource>): Observable<Device> {
    this.loadingSignal.set(true);
    return this.api.createDevice(newDevice).pipe(
      tap(created => {
        this.devicesSignal.update(list => [...list, created]);
        this.loadingSignal.set(false);
      }),
      catchError(err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
        throw err;
      })
    );
  }

  updateDevice(id: number, changes: Partial<DeviceResource>): Observable<Device> {
    this.loadingSignal.set(true);
    return this.api.updateDevice(id, changes).pipe(
      tap(updatedDevice => {
        this.devicesSignal.update(list =>
          list.map(d => (d.id === id ? updatedDevice : d))
        );
        this.loadingSignal.set(false);
      }),
      catchError(err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
        throw err;
      })
    );
  }

  /**
   * Elimina un dispositivo del sistema.
   * La lista local se actualiza y el consumo histórico permanece intacto.
   */
  deleteDevice(id: number): Observable<void> {
    this.loadingSignal.set(true);
    return this.api.deleteDevice(id).pipe(
      tap(() => {
        this.devicesSignal.update(list => list.filter(d => d.id !== id));
        this.loadingSignal.set(false);
      }),
      catchError(err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
        throw err;
      })
    );
  }
}

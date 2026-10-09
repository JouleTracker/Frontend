import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { SensorsApi } from '../infrastructure/sensors-api';
import { Sensor } from '../domain/model/sensor.entity';
import { ApplianceProfile } from '../domain/model/appliance-profile.entity';
import { SensorSummary } from '../domain/model/sensor-summary.entity';
import { SensorResource } from '../infrastructure/sensors-response';
import { IamStore } from '../../iam/application/iam.store';

@Injectable({
  providedIn: 'root'
})
export class SensorsStore {
  private readonly sensorsSignal = signal<Sensor[]>([]);
  readonly sensors = this.sensorsSignal.asReadonly();

  private readonly profilesSignal = signal<ApplianceProfile[]>([]);
  readonly profiles = this.profilesSignal.asReadonly();

  private readonly summarySignal = signal<SensorSummary | null>(null);
  readonly summary = this.summarySignal.asReadonly();

  private readonly searchTermSignal = signal<string>('');
  readonly searchTerm = this.searchTermSignal.asReadonly();

  private readonly selectedFilterSignal = signal<string>('Todos');
  readonly selectedFilter = this.selectedFilterSignal.asReadonly();

  private readonly selectedSortSignal = signal<string>('potencia-desc');
  readonly selectedSort = this.selectedSortSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  // === COMPUTED SIGNALS ===

  /** Sensores filtrados por término de búsqueda y filtro de estado/asignación */
  readonly filteredSensors = computed(() => {
    let result = [...this.sensorsSignal()];
    const term = this.searchTermSignal().trim().toLowerCase();
    const filter = this.selectedFilterSignal();
    const sort = this.selectedSortSignal();

    // 1. Filtrado por texto (nombre, dispositivo asignado o modelo)
    if (term) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(term) ||
        (s.assignedDeviceName && s.assignedDeviceName.toLowerCase().includes(term)) ||
        s.model.toLowerCase().includes(term) ||
        (s.serialNumber && s.serialNumber.toLowerCase().includes(term))
      );
    }

    // 2. Filtrado por estado / asignación
    if (filter === 'Monitoreando') {
      result = result.filter(s => s.isAssigned);
    } else if (filter === 'Sin asignar') {
      result = result.filter(s => !s.isAssigned);
    } else if (filter === 'En línea') {
      result = result.filter(s => s.status === 'En línea');
    } else if (filter === 'Desconectado') {
      result = result.filter(s => s.status === 'Desconectado');
    }

    // 3. Ordenamiento
    if (sort === 'potencia-desc') {
      result.sort((a, b) => b.currentPowerKw - a.currentPowerKw);
    } else if (sort === 'potencia-asc') {
      result.sort((a, b) => a.currentPowerKw - b.currentPowerKw);
    } else if (sort === 'energia-desc') {
      result.sort((a, b) => b.todayKwh - a.todayKwh);
    } else if (sort === 'nombre') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  });

  /** Total de sensores registrados */
  readonly totalSensorsCount = computed(() => {
    return this.sensorsSignal().length || this.summarySignal()?.totalSensors || 0;
  });

  /** Sensores activos en línea */
  readonly activeSensorsCount = computed(() => {
    return this.sensorsSignal().filter(s => s.status === 'En línea').length ||
      this.summarySignal()?.activeSensors || 0;
  });

  /** Sensores con dispositivo asignado */
  readonly monitoredDevicesCount = computed(() => {
    return this.sensorsSignal().filter(s => s.isAssigned).length ||
      this.summarySignal()?.monitoredDevicesCount || 0;
  });

  /** Sensores disponibles (sin asignar) */
  readonly unassignedSensorsCount = computed(() => {
    return this.sensorsSignal().filter(s => !s.isAssigned).length ||
      this.summarySignal()?.unassignedSensorsCount || 0;
  });

  /** Potencia total censada en kW */
  readonly totalMonitoredPowerKw = computed(() => {
    const list = this.sensorsSignal();
    if (list.length > 0) {
      const sum = list.reduce((acc, s) => acc + s.currentPowerKw, 0);
      return Number(sum.toFixed(2));
    }
    return this.summarySignal()?.totalMonitoredPowerKw || 0;
  });

  /** Energía total medida hoy en kWh */
  readonly totalEnergyTodayKwh = computed(() => {
    const list = this.sensorsSignal();
    if (list.length > 0) {
      const sum = list.reduce((acc, s) => acc + s.todayKwh, 0);
      return Number(sum.toFixed(2));
    }
    return this.summarySignal()?.totalEnergyTodayKwh || 0;
  });

  private readonly iamStore = inject(IamStore);

  // === LÍMITES DEL PLAN ===

  /** Límite de sensores según el plan (Starter 0, Plus 3, Pro ilimitado) */
  readonly sensorLimit = this.iamStore.sensorLimit;

  /** Sensores usados actualmente por el usuario */
  readonly sensorCount = computed(() => this.sensorsSignal().length);

  /** Indica si el usuario puede registrar un sensor más */
  readonly canAddSensor = computed(() => this.sensorCount() < this.sensorLimit());

  constructor(private readonly api: SensorsApi) {
    // Recarga los sensores cuando cambia el usuario autenticado (datos propios por usuario)
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

    this.api.getSensors().subscribe({
      next: data => {
        this.sensorsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      }
    });

    this.api.getApplianceProfiles().subscribe({
      next: profiles => {
        this.profilesSignal.set(profiles);
      },
      error: err => {
        console.error('Error cargando perfiles de aparatos:', err);
      }
    });

    this.api.getSensorSummary().subscribe({
      next: summary => {
        this.summarySignal.set(summary);
      },
      error: err => {
        console.error('Error cargando resumen de sensores:', err);
      }
    });
  }

  setSearchTerm(term: string): void {
    this.searchTermSignal.set(term);
  }

  selectFilter(filter: string): void {
    this.selectedFilterSignal.set(filter);
  }

  setSort(sort: string): void {
    this.selectedSortSignal.set(sort);
  }

  getSensorById(id: number): Sensor | undefined {
    return this.sensorsSignal().find(s => s.id === id);
  }

  createSensor(newSensor: Partial<SensorResource>): Observable<Sensor> {
    this.loadingSignal.set(true);
    return this.api.createSensor(newSensor).pipe(
      tap(created => {
        this.sensorsSignal.update(list => [...list, created]);
        this.loadingSignal.set(false);
      }),
      catchError(err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
        throw err;
      })
    );
  }

  updateSensor(id: number, changes: Partial<SensorResource>): Observable<Sensor> {
    this.loadingSignal.set(true);
    return this.api.updateSensor(id, changes).pipe(
      tap(updated => {
        this.sensorsSignal.update(list =>
          list.map(s => (s.id === id ? updated : s))
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
   * Desvincula el sensor de su dispositivo actual.
   * El sensor queda disponible en estado 'Sin asignar' para reutilizarse.
   * El consumo histórico registrado previamente permanece intacto.
   */
  unlinkSensor(id: number): Observable<Sensor> {
    return this.updateSensor(id, {
      assignedDeviceId: null,
      assignedDeviceName: null,
      assignedDeviceCategory: null,
      applianceProfileId: null,
      applianceProfileName: null,
      recommendedDailyKwh: null,
      currentPowerKw: 0
    });
  }

  /**
   * Elimina o da de baja el sensor IoT.
   * Se retira de la lista activa de monitoreo sin alterar los históricos de consumo ni reportes.
   */
  deleteSensor(id: number): Observable<void> {
    this.loadingSignal.set(true);
    return this.api.deleteSensor(id).pipe(
      tap(() => {
        this.sensorsSignal.update(list => list.filter(s => s.id !== id));
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


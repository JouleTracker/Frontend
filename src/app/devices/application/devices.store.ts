import { Injectable, computed, signal } from '@angular/core';
import { DevicesApi } from '../infrastructure/devices-api';
import { Device } from '../domain/model/device.entity';
import { DeviceSummary } from '../domain/model/device-summary.entity';

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

  // === COMPUTED SIGNALS ===

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

  /** Conteo de dispositivos conectados */
  readonly connectedDevices = computed(() => {
    const sum = this.summarySignal();
    if (sum) return sum.connectedDevices;
    return this.devicesSignal().filter(d => d.status === 'En línea').length || 8;
  });

  /** Conteo de dispositivos en espera */
  readonly waitingDevices = computed(() => {
    const sum = this.summarySignal();
    if (sum) return sum.waitingDevices;
    return this.devicesSignal().filter(d => d.status === 'En espera').length || 4;
  });

  /** Potencia total actual en kW */
  readonly totalPowerKw = computed(() => {
    const sum = this.summarySignal();
    if (sum) return sum.totalPowerKw;
    const total = this.devicesSignal().reduce((acc, d) => acc + d.currentPowerKw, 0);
    return Number(total.toFixed(2)) || 1.2;
  });

  /** Etiqueta de variación vs ayer */
  readonly powerDiffVsYesterdayLabel = computed(() => {
    return this.summarySignal()?.powerDiffVsYesterdayLabel ?? '12% vs ayer';
  });

  /** Costo estimado en el mes (S/) */
  readonly estimatedCostSoles = computed(() => {
    return this.summarySignal()?.estimatedCostSoles ?? 35.20;
  });

  /** Etiqueta de variación del costo vs mes anterior */
  readonly costDiffVsMonthLabel = computed(() => {
    return this.summarySignal()?.costDiffVsMonthLabel ?? '8% vs mes anterior';
  });

  /** Emisiones evitadas de CO2 (kg) */
  readonly co2AvoidedKg = computed(() => {
    return this.summarySignal()?.co2AvoidedKg ?? 28.6;
  });

  /** Equivalencia ecológica en árboles */
  readonly treeEquivalence = computed(() => {
    return this.summarySignal()?.treeEquivalence ?? 'Equivale a 1 árbol';
  });

  constructor(private api: DevicesApi) {
    this.loadAll();
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
}

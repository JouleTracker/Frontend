import { computed, inject, Injectable, signal } from '@angular/core';
import { ReportsApi } from '../infrastructure/reports-api';
import { ConsumptionRecord } from '../domain/consumption-record.entity';

export interface FilterRange {
  start: string;
  end: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsStore {
  private readonly api = inject(ReportsApi);

  private readonly _records = signal<ConsumptionRecord[]>([]);
  readonly rate = signal<number>(0.85);

  readonly applied = signal<FilterRange>({ start: '', end: '' });
  readonly error = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  // Registros filtrados reactivamente por el rango aplicado
  readonly filtered = computed(() => {
    const list = this._records();
    const { start, end } = this.applied();
    if (!start || !end) return list;

    return list.filter((r) => r.date >= start && r.date <= end);
  });

  // Métricas calculadas
  readonly total = computed(() =>
    this.filtered().reduce((sum, r) => sum + r.consumptionKwh, 0)
  );

  readonly average = computed(() => {
    const count = this.filtered().length;
    return count > 0 ? this.total() / count : 0;
  });

  readonly peak = computed(() => {
    const list = this.filtered();
    if (!list.length) return 1;
    return Math.max(...list.map((r) => r.consumptionKwh));
  });

  loadInitialData(): void {
    this.isLoading.set(true);

    this.api.getConfig().subscribe({
      next: (cfg) => {
        if (cfg?.kwhRate) this.rate.set(cfg.kwhRate);
      },
      error: () => console.warn('Usando tarifa default (0.85)')
    });

    this.api.getConsumptionRecords().subscribe({
      next: (data) => {
        // Ordenar cronológicamente
        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
        this._records.set(sorted);
        this.isLoading.set(false);

        // Por defecto, aplicar últimos 30 días según los datos recibidos
        if (sorted.length > 0) {
          const lastDate = sorted[sorted.length - 1].date;
          const firstDate = sorted[Math.max(0, sorted.length - 30)].date;
          this.applied.set({ start: firstDate, end: lastDate });
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar los registros de consumo');
        this.isLoading.set(false);
      }
    });
  }

  applyCustomRange(start: string, end: string): boolean {
    if (!start || !end) {
      this.error.set('Por favor ingresa ambas fechas.');
      return false;
    }
    if (start > end) {
      this.error.set('La fecha inicial no puede ser posterior a la fecha final.');
      return false;
    }

    this.error.set('');
    this.applied.set({ start, end });
    return true;
  }

  applyDaysPreset(days: number): void {
    const list = this._records();
    if (!list.length) return;

    const maxDate = list[list.length - 1].date;
    const startIndex = Math.max(0, list.length - days);
    const minDate = list[startIndex].date;

    this.error.set('');
    this.applied.set({ start: minDate, end: maxDate });
  }

  applyCurrentMonthPreset(): void {
    const list = this._records();
    if (!list.length) return;

    const last = list[list.length - 1].date;
    const currentYearMonth = last.slice(0, 7); // ej: "2026-10"
    const monthRecords = list.filter((r) => r.date.startsWith(currentYearMonth));

    if (monthRecords.length) {
      this.error.set('');
      this.applied.set({
        start: monthRecords[0].date,
        end: monthRecords[monthRecords.length - 1].date
      });
    }
  }

  resetToDefault(): void {
    this.applyDaysPreset(30);
  }
}

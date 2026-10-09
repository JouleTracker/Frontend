import { computed, inject, Injectable, signal } from '@angular/core';
import { ReportsApi } from '../infrastructure/reports-api';
import { ConsumptionRecord } from '../domain/consumption-record.entity';
import { IamStore } from '../../iam/application/iam.store';
import { ELECTRICITY_TARIFF_PER_KWH } from '../../shared/domain/model/energy-calculation.constants';

export interface FilterRange {
  start: string;
  end: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsStore {
  private readonly api = inject(ReportsApi);
  private readonly iamStore = inject(IamStore);

  private readonly _records = signal<ConsumptionRecord[]>([]);

  /** Tarifa de referencia del dominio (OSINERGMIN BT5B residencial): S/ 0.70 por kWh */
  readonly rate = signal<number>(ELECTRICITY_TARIFF_PER_KWH);

  readonly applied = signal<FilterRange>({ start: '', end: '' });
  readonly error = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  /** Días máximos de historial según el plan (Starter 7, Plus 30, Pro ilimitado) */
  readonly historyLimitDays = this.iamStore.historyDaysLimit;

  /** Plan actual del usuario (para mensajes de la vista) */
  readonly currentPlan = this.iamStore.currentPlan;

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
    if (!list.length) return 0;
    return Math.max(...list.map((r) => r.consumptionKwh));
  });

  loadInitialData(): void {
    this.isLoading.set(true);

    this.api.getConsumptionRecords().subscribe({
      next: (data) => {
        // Ordenar cronológicamente (fechas ISO)
        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
        this._records.set(sorted);
        this.isLoading.set(false);

        // Por defecto, aplicar el rango máximo permitido por el plan del usuario
        if (sorted.length > 0) {
          this.resetToDefault();
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

    // El rango nunca puede exceder los días de historial que permite el plan
    const limit = this.historyLimitDays();
    let effectiveStart = start;
    if (Number.isFinite(limit)) {
      const minStart = this.subtractDays(end, limit - 1);
      if (effectiveStart < minStart) {
        effectiveStart = minStart;
      }
    }

    this.error.set('');
    this.applied.set({ start: effectiveStart, end });
    return true;
  }

  applyDaysPreset(days: number): void {
    const list = this._records();
    if (!list.length) return;

    const limit = this.historyLimitDays();
    const effectiveDays = Number.isFinite(limit) ? Math.min(days, limit) : days;

    const maxDate = list[list.length - 1].date;
    const startIndex = Math.max(0, list.length - effectiveDays);
    const minDate = list[startIndex].date;

    this.error.set('');
    this.applied.set({ start: minDate, end: maxDate });
  }

  applyCurrentMonthPreset(): void {
    const list = this._records();
    if (!list.length) return;

    const limit = this.historyLimitDays();
    const last = list[list.length - 1].date;
    const currentYearMonth = last.slice(0, 7); // ej: "2026-10"
    let monthRecords = list.filter((r) => r.date.startsWith(currentYearMonth));

    if (Number.isFinite(limit) && monthRecords.length > limit) {
      monthRecords = monthRecords.slice(monthRecords.length - limit);
    }

    if (monthRecords.length) {
      this.error.set('');
      this.applied.set({
        start: monthRecords[0].date,
        end: monthRecords[monthRecords.length - 1].date
      });
    }
  }

  resetToDefault(): void {
    const limit = this.historyLimitDays();
    this.applyDaysPreset(Number.isFinite(limit) ? limit : 30);
  }

  private subtractDays(isoDate: string, days: number): string {
    const d = new Date(`${isoDate}T00:00:00`);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
}

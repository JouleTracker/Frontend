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
  readonly isExporting = signal<boolean>(false);

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

  loadInitialData(from?: string, to?: string): void {
    this.isLoading.set(true);

    this.api.getConsumptionRecords(from, to).subscribe({
      next: (data) => {
        // Ordenar cronológicamente (fechas ISO)
        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
        this._records.set(sorted);
        this.isLoading.set(false);

        // Por defecto, aplicar el rango máximo permitido por el plan del usuario
        if (sorted.length > 0 && !from && !to) {
          this.resetToDefault();
        }
      },
      error: () => {
        this.error.set('Could not load consumption records.');
        this.isLoading.set(false);
      }
    });
  }

  applyCustomRange(start: string, end: string): boolean {
    if (!start || !end) {
      this.error.set('Please enter both dates.');
      return false;
    }
    if (start > end) {
      this.error.set('Start date cannot be later than end date.');
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

  buildCsvFromFiltered(): string {
    const rate = this.rate();
    const lines = ['date,consumptionKwh,estimatedCostPen'];
    for (const record of this.filtered()) {
      const kwh = Number(record.consumptionKwh ?? 0);
      const cost = (kwh * rate).toFixed(2);
      lines.push(`${this.escapeCsv(record.date)},${kwh.toFixed(2)},${cost}`);
    }
    return lines.join('\n');
  }

  exportCsv(): void {
    const { start, end } = this.applied();
    const filename = `consumption-report-${start || 'all'}.csv`;
    this.isExporting.set(true);

    if (typeof this.api.exportConsumptionCsv === 'function') {
      this.api.exportConsumptionCsv(start, end).subscribe({
        next: (blob) => {
          try {
            this.triggerBlobDownload(blob, filename);
          } finally {
            this.isExporting.set(false);
          }
        },
        error: () => {
          try {
            const fallbackBlob = new Blob([this.buildCsvFromFiltered()], { type: 'text/csv;charset=utf-8;' });
            this.triggerBlobDownload(fallbackBlob, filename);
          } finally {
            this.isExporting.set(false);
          }
        }
      });
      return;
    }

    try {
      const blob = new Blob([this.buildCsvFromFiltered()], { type: 'text/csv;charset=utf-8;' });
      this.triggerBlobDownload(blob, filename);
    } finally {
      this.isExporting.set(false);
    }
  }

  buildPrintableReportHtml(): string {
    const { start, end } = this.applied();
    const rate = this.rate();
    const rows = this.filtered()
      .map((record) => {
        const kwh = Number(record.consumptionKwh ?? 0);
        const cost = (kwh * rate).toFixed(2);
        return `<tr><td>${this.escapeHtml(record.date)}</td><td>${kwh.toFixed(2)}</td><td>S/ ${cost}</td></tr>`;
      })
      .join('');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>JouleTracker Energy Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    .meta { color: #4b5563; margin-bottom: 18px; font-size: 13px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
    .kpi small { display: block; color: #6b7280; font-size: 11px; }
    .kpi strong { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>JouleTracker — Consumption Report</h1>
  <p class="meta">Period: ${this.escapeHtml(start || 'N/A')} – ${this.escapeHtml(end || 'N/A')} · Rate: S/ ${rate.toFixed(2)}/kWh</p>
  <div class="kpis">
    <div class="kpi"><small>Total Consumption</small><strong>${this.total().toFixed(2)} kWh</strong></div>
    <div class="kpi"><small>Daily Average</small><strong>${this.average().toFixed(2)} kWh</strong></div>
    <div class="kpi"><small>Estimated Cost</small><strong>S/ ${(this.total() * rate).toFixed(2)}</strong></div>
    <div class="kpi"><small>Peak Consumption</small><strong>${this.peak().toFixed(2)} kWh</strong></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Consumption (kWh)</th><th>Estimated Cost</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  }

  exportPdf(): void {
    const html = this.buildPrintableReportHtml();
    const printWindow = typeof window !== 'undefined'
      ? window.open('', '_blank', 'width=900,height=700')
      : null;

    if (printWindow && printWindow.document) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      if (typeof printWindow.focus === 'function') {
        printWindow.focus();
      }
      if (typeof printWindow.print === 'function') {
        printWindow.print();
      }
      return;
    }

    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  private triggerBlobDownload(blob: Blob, filename: string): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return;
    }
    let url: string | null = null;
    try {
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      /* ignore DOM/URL polyfill errors in headless test environments */
    } finally {
      if (url && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    }
  }

  private escapeCsv(value: string): string {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private escapeHtml(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private subtractDays(isoDate: string, days: number): string {
    const d = new Date(`${isoDate}T00:00:00`);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
}

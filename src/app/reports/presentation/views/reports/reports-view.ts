import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportsStore } from '../../../application/reports.store';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-reports-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, DecimalPipe, TranslatePipe],
  templateUrl: './reports-view.html',
  styleUrl: './reports-view.css',
})
export class ReportsViewComponent implements OnInit {
  readonly store = inject(ReportsStore);

  /** Controla si el panel de filtros está visible */
  readonly showFilters = signal<boolean>(false);

  period = '7';
  startDate = '';
  endDate = '';

  readonly applied = this.store.applied;
  readonly filtered = this.store.filtered;
  readonly total = this.store.total;
  readonly average = this.store.average;
  readonly peak = this.store.peak;
  readonly error = this.store.error;

  /** Límite de días de historial según el plan (Starter 7, Plus 30, Pro ilimitado) */
  readonly historyLimitDays = this.store.historyLimitDays;
  readonly currentPlan = this.store.currentPlan;

  /** Indica si el plan permite ver más de 7 días de historial */
  readonly canView30Days = computed(() => this.historyLimitDays() >= 30);

  /** Indica si el plan tiene un tope de días de historial (Starter 7, Plus 30) */
  readonly hasHistoryLimit = computed(() => Number.isFinite(this.historyLimitDays()));

  constructor() {
    // Sincroniza los inputs de fecha cada vez que cambia el rango aplicado
    effect(() => {
      const range = this.store.applied();
      this.startDate = range.start;
      this.endDate = range.end;
    });
  }

  get rate(): number {
    return this.store.rate();
  }

  ngOnInit(): void {
    // Siempre inicia predeterminado en los últimos 7 días
    this.period = '7';
    this.store.loadInitialData();
    this.applyPresetGmt5(7);
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  /**
   * Genera una cadena YYYY-MM-DD en la zona horaria GMT-5
   */
  private formatGmt5(date: Date): string {
    const targetOffsetMinutes = -5 * 60;
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const gmt5Date = new Date(utcTime + targetOffsetMinutes * 60000);

    const year = gmt5Date.getFullYear();
    const month = String(gmt5Date.getMonth() + 1).padStart(2, '0');
    const day = String(gmt5Date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private applyPresetGmt5(days: number): void {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));

    this.startDate = this.formatGmt5(start);
    this.endDate = this.formatGmt5(today);
    this.store.applyCustomRange(this.startDate, this.endDate);
  }

  selectPeriod(): void {
    if (this.period === '7') {
      this.applyPresetGmt5(7);
    } else if (this.period === '30') {
      this.applyPresetGmt5(30);
    } else if (this.period === 'month') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.startDate = this.formatGmt5(firstDay);
      this.endDate = this.formatGmt5(today);
      this.store.applyCustomRange(this.startDate, this.endDate);
    }
  }

  applyFilters(): void {
    this.store.applyCustomRange(this.startDate, this.endDate);
  }

  reset(): void {
    this.period = '7';
    this.applyPresetGmt5(7);
  }
}

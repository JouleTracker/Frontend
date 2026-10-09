import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportsStore } from '../../../application/reports.store';

@Component({
  selector: 'app-reports-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, DecimalPipe],
  templateUrl: './reports-view.html',
  styleUrl: './reports-view.css',
})
export class ReportsViewComponent implements OnInit {
  readonly store = inject(ReportsStore);

  period = '30';
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
    // Período por defecto según el plan del usuario
    this.period = this.canView30Days() ? '30' : '7';
    this.store.loadInitialData();
  }

  selectPeriod(): void {
    if (this.period === '7') {
      this.store.applyDaysPreset(7);
    } else if (this.period === '30') {
      this.store.applyDaysPreset(30);
    } else if (this.period === 'month') {
      this.store.applyCurrentMonthPreset();
    }
  }

  applyFilters(): void {
    this.store.applyCustomRange(this.startDate, this.endDate);
  }

  reset(): void {
    this.period = this.canView30Days() ? '30' : '7';
    this.store.resetToDefault();
  }
}

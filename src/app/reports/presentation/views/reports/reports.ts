import { Component, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportPeriod } from '../../../domain/consumption-record';
import { createConsumptionMock, DEMO_RATE_PER_KWH, localDate } from '../../../infrastructure/reports-mock';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './reports.html',
  styleUrl: '../../../../shared/presentation/reporting.css',
})
export class Reports {
  readonly rate = DEMO_RATE_PER_KWH;
  readonly records = signal(createConsumptionMock());
  readonly error = signal('');
  period: ReportPeriod = '7';
  startDate = '';
  endDate = '';
  readonly applied = signal({ start: '', end: '' });
  readonly filtered = computed(() => this.records().filter(record => record.date >= this.applied().start && record.date <= this.applied().end));
  readonly total = computed(() => this.filtered().reduce((sum, record) => sum + record.consumptionKwh, 0));
  readonly average = computed(() => this.filtered().length ? this.total() / this.filtered().length : 0);
  readonly peak = computed(() => Math.max(0, ...this.filtered().map(record => record.consumptionKwh)));

  constructor() { this.reset(); }

  selectPeriod(): void {
    if (this.period === 'custom') return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), this.period === 'month' ? 1 : today.getDate() - Number(this.period) + 1);
    this.startDate = localDate(start);
    this.endDate = localDate(today);
  }

  applyFilters(): void {
    if (!this.isValidDate(this.startDate) || !this.isValidDate(this.endDate)) {
      this.error.set('Selecciona una fecha inicial y una fecha final válidas.');
      return;
    }
    if (this.startDate > this.endDate) {
      this.error.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    this.error.set('');
    this.applied.set({ start: this.startDate, end: this.endDate });
  }

  reset(): void {
    this.period = '7';
    this.selectPeriod();
    this.applyFilters();
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00`);
    return !Number.isNaN(parsed.getTime()) && localDate(parsed) === value;
  }
}

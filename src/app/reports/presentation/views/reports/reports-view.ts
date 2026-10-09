import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsStore } from '../../../application/reports.store';
import { Sidebar } from '../../../../shared/presentation/components/sidebar/sidebar';

@Component({
  selector: 'app-reports-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
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

  get rate(): number {
    return this.store.rate();
  }

  ngOnInit(): void {
    this.store.loadInitialData();

    // Sincronizar fechas en los inputs del formulario
    setTimeout(() => {
      this.syncInputsWithApplied();
    }, 300);
  }

  selectPeriod(): void {
    if (this.period === '7') {
      this.store.applyDaysPreset(7);
      this.syncInputsWithApplied();
    } else if (this.period === '30') {
      this.store.applyDaysPreset(30);
      this.syncInputsWithApplied();
    } else if (this.period === 'month') {
      this.store.applyCurrentMonthPreset();
      this.syncInputsWithApplied();
    }
  }

  applyFilters(): void {
    this.store.applyCustomRange(this.startDate, this.endDate);
  }

  reset(): void {
    this.period = '30';
    this.store.resetToDefault();
    this.syncInputsWithApplied();
  }

  private syncInputsWithApplied(): void {
    const range = this.store.applied();
    this.startDate = range.start;
    this.endDate = range.end;
  }
}

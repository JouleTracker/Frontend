import { Component, DestroyRef, Input, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ComparativeConsumption } from '../../../domain/model/comparative-consumption.entity';
import { ConsumptionHistory } from '../../../domain/model/consumption-history.entity';

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, TranslatePipe],
  templateUrl: './comparison-chart.component.html',
  styleUrl: './comparison-chart.component.css'
})
export class ComparisonChartComponent implements OnChanges {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() items: ComparativeConsumption[] = [];
  @Input() histories: ConsumptionHistory[] = [];

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  public viewMode: 'period' | 'weekly' = 'weekly';
  public weeklyDeltaPercent: number | null = null;
  public barChartType: ChartType = 'bar';

  constructor() {
    const sub = this.translate.onLangChange.subscribe(() => this.updateChart());
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y} kWh`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        }
      }
    }
  };

  // Starts empty: populated with real comparative-consumptions data
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Previous period',
        data: [],
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        barPercentage: 0.65
      },
      {
        label: 'Current period',
        data: [],
        backgroundColor: '#86efac',
        borderRadius: 4,
        barPercentage: 0.65
      }
    ]
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['histories']) {
      this.updateChart();
    }
  }

  setViewMode(mode: 'period' | 'weekly'): void {
    if (this.viewMode === mode) {
      return;
    }
    this.viewMode = mode;
    this.updateChart();
  }

  private updateChart(): void {
    const prevRaw = this.translate.instant('CONSUMPTION.PREVIOUS_PERIOD');
    const currRaw = this.translate.instant('CONSUMPTION.CURRENT_PERIOD');
    const prevLabel = prevRaw !== 'CONSUMPTION.PREVIOUS_PERIOD' ? prevRaw : 'Previous period';
    const currLabel = currRaw !== 'CONSUMPTION.CURRENT_PERIOD' ? currRaw : 'Current period';

    if (this.viewMode === 'weekly' && this.histories && this.histories.length > 0) {
      const weekly = this.buildWeeklyComparison(this.histories);
      this.weeklyDeltaPercent = weekly.deltaPercent;
      this.barChartData = {
        labels: weekly.labels,
        datasets: [
          {
            label: prevLabel,
            data: weekly.previousData,
            backgroundColor: '#e2e8f0',
            borderRadius: 4,
            barPercentage: 0.65
          },
          {
            label: currLabel,
            data: weekly.currentData,
            backgroundColor: '#86efac',
            borderRadius: 4,
            barPercentage: 0.65
          }
        ]
      };
      this.chartDirective?.update();
      return;
    }

    this.weeklyDeltaPercent = null;
    const hasData = this.items && this.items.length > 0;
    this.barChartData = {
      labels: hasData ? this.items.map(i => i.month) : [],
      datasets: [
        {
          label: prevLabel,
          data: hasData ? this.items.map(i => i.previousPeriod) : [],
          backgroundColor: '#e2e8f0',
          borderRadius: 4,
          barPercentage: 0.65
        },
        {
          label: currLabel,
          data: hasData ? this.items.map(i => i.currentPeriod) : [],
          backgroundColor: '#86efac',
          borderRadius: 4,
          barPercentage: 0.65
        }
      ]
    };
    this.chartDirective?.update();
  }

  private buildWeeklyComparison(histories: ConsumptionHistory[]): {
    labels: string[];
    previousData: number[];
    currentData: number[];
    deltaPercent: number | null;
  } {
    const parsed = histories
      .map(h => ({
        ms: Date.parse(`${h.date.slice(0, 10)}T00:00:00Z`),
        kwh: this.parseKwh(h.consumption)
      }))
      .filter(entry => !Number.isNaN(entry.ms))
      .sort((a, b) => a.ms - b.ms);

    if (parsed.length === 0) {
      return { labels: [], previousData: [], currentData: [], deltaPercent: null };
    }

    const dayMs = 86_400_000;
    const latestMs = parsed[parsed.length - 1].ms;

    // 5 rolling 7-day buckets: weekTotals[0] is oldest (comparison baseline for W1), weekTotals[4] is latest week (W4)
    const weekTotals = [0, 0, 0, 0, 0];
    for (const entry of parsed) {
      const daysAgo = Math.floor((latestMs - entry.ms) / dayMs);
      const reverseIndex = Math.floor(daysAgo / 7);
      if (reverseIndex >= 0 && reverseIndex < 5) {
        weekTotals[4 - reverseIndex] += entry.kwh;
      }
    }

    const prefixRaw = this.translate.instant('CONSUMPTION.WEEK_PREFIX');
    const prefix = prefixRaw !== 'CONSUMPTION.WEEK_PREFIX' ? prefixRaw : 'W';
    const labels = [1, 2, 3, 4].map(idx => `${prefix}${idx}`);
    const previousData = [0, 1, 2, 3].map(idx => Number(weekTotals[idx].toFixed(2)));
    const currentData = [1, 2, 3, 4].map(idx => Number(weekTotals[idx].toFixed(2)));

    const latest = currentData[3];
    const prior = currentData[2];
    const deltaPercent = prior > 0 ? Number((((latest - prior) / prior) * 100).toFixed(1)) : null;

    return { labels, previousData, currentData, deltaPercent };
  }

  private parseKwh(raw: string): number {
    if (!raw) return 0;
    const num = parseFloat(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  }
}

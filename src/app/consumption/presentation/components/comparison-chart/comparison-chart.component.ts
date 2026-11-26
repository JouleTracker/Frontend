import { Component, DestroyRef, Input, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ComparativeConsumption } from '../../../domain/model/comparative-consumption.entity';

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

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

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
        max: 150,
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          stepSize: 50,
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
    if (changes['items']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    const hasData = this.items && this.items.length > 0;
    const prevRaw = this.translate.instant('CONSUMPTION.PREVIOUS_PERIOD');
    const currRaw = this.translate.instant('CONSUMPTION.CURRENT_PERIOD');
    const prevLabel = prevRaw !== 'CONSUMPTION.PREVIOUS_PERIOD' ? prevRaw : 'Previous period';
    const currLabel = currRaw !== 'CONSUMPTION.CURRENT_PERIOD' ? currRaw : 'Current period';

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

}

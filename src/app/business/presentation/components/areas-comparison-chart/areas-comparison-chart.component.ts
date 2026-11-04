import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AreaMetrics } from '../../../application/areas.store';

@Component({
  selector: 'app-areas-comparison-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './areas-comparison-chart.component.html',
  styleUrls: ['./areas-comparison-chart.component.css']
})
export class AreasComparisonChartComponent implements OnChanges {
  @Input() items: AreaMetrics[] = [];

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  public barChartType: ChartType = 'bar';

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` Consumo hoy: ${context.parsed.y} kWh`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#475569',
          font: { size: 11, weight: 'bold' }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (val) => `${val} kWh`
        }
      }
    }
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#14b8a6',
          '#64748b'
        ],
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      const labels = this.items.map((i) => i.area.name);
      const data = this.items.map((i) => i.todayKwh);

      this.barChartData = {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              '#10b981',
              '#3b82f6',
              '#f59e0b',
              '#8b5cf6',
              '#ec4899',
              '#14b8a6',
              '#64748b'
            ].slice(0, labels.length),
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      };

      this.chartDirective?.update();
    }
  }
}

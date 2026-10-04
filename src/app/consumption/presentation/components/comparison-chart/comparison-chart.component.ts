import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ComparativeConsumption } from '../../../domain/model/comparative-consumption.entity';

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './comparison-chart.component.html',
  styleUrl: './comparison-chart.component.css'
})
export class ComparisonChartComponent implements OnChanges {
  @Input() items: ComparativeConsumption[] = [];

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  public barChartType: ChartType = 'bar';

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

  public barChartData: ChartData<'bar'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
    datasets: [
      {
        label: 'Período anterior',
        data: [45, 70, 135, 60, 80],
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        barPercentage: 0.65
      },
      {
        label: 'Período actual',
        data: [55, 140, 145, 140, 65],
        backgroundColor: '#86efac',
        borderRadius: 4,
        barPercentage: 0.65
      }
    ]
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.items && this.items.length > 0) {
      this.barChartData = {
        labels: this.items.map(i => i.month),
        datasets: [
          {
            label: 'Período anterior',
            data: this.items.map(i => i.previousPeriod),
            backgroundColor: '#e2e8f0',
            borderRadius: 4,
            barPercentage: 0.65
          },
          {
            label: 'Período actual',
            data: this.items.map(i => i.currentPeriod),
            backgroundColor: '#86efac',
            borderRadius: 4,
            barPercentage: 0.65
          }
        ]
      };
      this.chartDirective?.update();
    }
  }
}

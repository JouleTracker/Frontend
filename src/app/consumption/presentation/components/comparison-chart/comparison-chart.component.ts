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

  // Inicia vacío: solo se dibuja con los datos reales de `comparative-consumptions` (db.json)
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Período anterior',
        data: [],
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        barPercentage: 0.65
      },
      {
        label: 'Período actual',
        data: [],
        backgroundColor: '#86efac',
        borderRadius: 4,
        barPercentage: 0.65
      }
    ]
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      const hasData = this.items && this.items.length > 0;
      this.barChartData = {
        labels: hasData ? this.items.map(i => i.month) : [],
        datasets: [
          {
            label: 'Período anterior',
            data: hasData ? this.items.map(i => i.previousPeriod) : [],
            backgroundColor: '#e2e8f0',
            borderRadius: 4,
            barPercentage: 0.65
          },
          {
            label: 'Período actual',
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

}

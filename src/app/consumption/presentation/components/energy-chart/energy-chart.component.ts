import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { EnergyReading } from '../../../domain/model/energy-reading.entity';

@Component({
  selector: 'app-energy-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './energy-chart.component.html',
  styleUrl: './energy-chart.component.css'
})
export class EnergyChartComponent implements OnChanges {
  @Input() reading: EnergyReading | null = null;
  @Input() selectedPeriod: 'dia' | 'semana' | 'mes' | 'ano' = 'semana';
  @Output() periodChange = new EventEmitter<'dia' | 'semana' | 'mes' | 'ano'>();

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  public barChartType: ChartType = 'bar';

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.parsed.y} kWh`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 'normal' }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 }
        }
      }
    }
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.55
      }
    ]
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reading'] && this.reading) {
      this.updateChartData();
    }
  }

  selectPeriod(period: 'dia' | 'semana' | 'mes' | 'ano'): void {
    this.selectedPeriod = period;
    this.periodChange.emit(period);
  }

  private updateChartData(): void {
    if (!this.reading) return;

    const colors = this.reading.values.map(val => {
      return val > 70 ? '#1e40af' : '#bfdbfe';
    });

    this.barChartData = {
      labels: this.reading.labels,
      datasets: [
        {
          data: this.reading.values,
          backgroundColor: colors,
          hoverBackgroundColor: '#1d4ed8',
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.55
        }
      ]
    };

    this.chartDirective?.update();
  }
}

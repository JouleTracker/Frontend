import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { EnergyReading } from '../../../domain/model/energy-reading.entity';

@Component({
  selector: 'app-hourly-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './hourly-chart.component.html',
  styleUrl: './hourly-chart.component.css'
})
export class HourlyChartComponent implements OnChanges {
  @Input() title: string = 'Consumo durante el día';
  @Input() showRealtimeHeader: boolean = false;
  @Input() realtimeKw: number = 1.24;
  @Input() reading: EnergyReading | null = null;

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  public lineChartType: ChartType = 'line';

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0 }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` ${context.parsed.y} kW`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        }
      },
      y: {
        beginAtZero: true,
        max: 4.0,
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          stepSize: 1.0,
          color: '#64748b',
          font: { size: 10 }
        }
      }
    }
  };

  // Inicia vacío: solo se dibuja con los datos reales de `energy-readings` (db.json)
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        fill: true,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.28)',
        borderWidth: 2
      }
    ]
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reading']) {
      const hasData = this.reading && this.reading.labels && this.reading.labels.length > 0;
      this.lineChartData = {
        labels: hasData ? this.reading!.labels : [],
        datasets: [
          {
            data: hasData ? this.reading!.values : [],
            fill: true,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.28)',
            borderWidth: 2
          }
        ]
      };
      this.chartDirective?.update();
    }
  }
}

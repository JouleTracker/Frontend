import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DeviceDistribution } from '../../../domain/model/device-distribution.entity';

@Component({
  selector: 'app-device-distribution-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './device-distribution-chart.component.html',
  styleUrl: './device-distribution-chart.component.css'
})
export class DeviceDistributionChartComponent implements OnChanges {
  @Input() items: DeviceDistribution[] = [];
  @Input() totalKwh: number = 82.4;

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  public doughnutChartType = 'doughnut' as const;

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.items && this.items.length > 0) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    this.doughnutChartData = {
      labels: this.items.map(i => i.name),
      datasets: [
        {
          data: this.items.map(i => i.percentage),
          backgroundColor: this.items.map(i => i.color),
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    };
    this.chartDirective?.update();
  }
}

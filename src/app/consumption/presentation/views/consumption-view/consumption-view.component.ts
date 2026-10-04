import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsumptionStore } from '../../../application/consumption.store';
import { MetricCardComponent } from '../../components/metric-card/metric-card.component';
import { EnergyChartComponent } from '../../components/energy-chart/energy-chart.component';
import { DeviceDistributionChartComponent } from '../../components/device-distribution-chart/device-distribution-chart.component';
import { HourlyChartComponent } from '../../components/hourly-chart/hourly-chart.component';
import { ComparisonChartComponent } from '../../components/comparison-chart/comparison-chart.component';
import { ConsumptionHistoryTableComponent } from '../../components/consumption-history-table/consumption-history-table.component';
import { RecentAlertsWidgetComponent } from '../../../../alerts/presentation/components/recent-alerts-widget/recent-alerts-widget.component';
import { RecommendationsWidgetComponent } from '../../../../recommendations/presentation/components/recommendations-widget/recommendations-widget.component';

@Component({
  selector: 'app-consumption-view',
  standalone: true,
  imports: [
    CommonModule,
    MetricCardComponent,
    EnergyChartComponent,
    DeviceDistributionChartComponent,
    HourlyChartComponent,
    ComparisonChartComponent,
    ConsumptionHistoryTableComponent,
    RecentAlertsWidgetComponent,
    RecommendationsWidgetComponent
  ],
  templateUrl: './consumption-view.component.html',
  styleUrl: './consumption-view.component.css'
})
export class ConsumptionViewComponent {
  readonly store = inject(ConsumptionStore);
}

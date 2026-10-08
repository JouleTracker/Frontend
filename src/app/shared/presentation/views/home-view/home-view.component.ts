import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../auth/application/auth.service';
import { ConsumptionStore } from '../../../../consumption/application/consumption.store';
import { MetricCardComponent } from '../../../../consumption/presentation/components/metric-card/metric-card.component';
import { EnergyChartComponent } from '../../../../consumption/presentation/components/energy-chart/energy-chart.component';
import { DeviceDistributionChartComponent } from '../../../../consumption/presentation/components/device-distribution-chart/device-distribution-chart.component';
import { HourlyChartComponent } from '../../../../consumption/presentation/components/hourly-chart/hourly-chart.component';
import { ComparisonChartComponent } from '../../../../consumption/presentation/components/comparison-chart/comparison-chart.component';
import { AvoidedEmissionsCardComponent } from '../../../../consumption/presentation/components/avoided-emissions-card/avoided-emissions-card.component';
import { RecentAlertsWidgetComponent } from '../../../../alerts/presentation/components/recent-alerts-widget/recent-alerts-widget.component';
import { RecommendationsWidgetComponent } from '../../../../recommendations/presentation/components/recommendations-widget/recommendations-widget.component';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [
    CommonModule,
    MetricCardComponent,
    EnergyChartComponent,
    DeviceDistributionChartComponent,
    HourlyChartComponent,
    ComparisonChartComponent,
    AvoidedEmissionsCardComponent,
    RecentAlertsWidgetComponent,
    RecommendationsWidgetComponent,
    Sidebar,
  ],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.css',
})
export class HomeViewComponent {
  readonly store = inject(ConsumptionStore);
  private readonly authService = inject(AuthService);

  readonly userName = computed(() => {
    return this.authService.currentUser()?.name || 'Usuario';
  });
}

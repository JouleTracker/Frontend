import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ComparisonChartComponent } from './comparison-chart.component';
import { ComparativeConsumption } from '../../../domain/model/comparative-consumption.entity';
import { ConsumptionHistory } from '../../../domain/model/consumption-history.entity';

describe('ComparisonChartComponent', () => {
  let component: ComparisonChartComponent;
  let fixture: ComponentFixture<ComparisonChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonChartComponent],
      providers: [provideTranslateService(), provideCharts(withDefaultRegisterables())]
    }).compileComponents();

    fixture = TestBed.createComponent(ComparisonChartComponent);
    component = fixture.componentInstance;
  });

  it('computes granular rolling weekly comparison buckets and week-over-week delta', () => {
    const histories = [
      new ConsumptionHistory({ id: 1, date: '2026-11-12', consumption: '10.00 kWh', cost: 'S/ 7.00', status: 'Normal' }),
      new ConsumptionHistory({ id: 2, date: '2026-11-19', consumption: '15.00 kWh', cost: 'S/ 10.50', status: 'Normal' }),
      new ConsumptionHistory({ id: 3, date: '2026-11-26', consumption: '12.00 kWh', cost: 'S/ 8.40', status: 'Normal' })
    ];
    component.histories = histories;
    component.ngOnChanges({
      histories: new SimpleChange([], histories, true)
    });

    expect(component.viewMode).toBe('weekly');
    expect(component.barChartData.labels).toEqual(['W1', 'W2', 'W3', 'W4']);
    expect(component.barChartData.datasets[0].data).toEqual([0, 0, 10, 15]);
    expect(component.barChartData.datasets[1].data).toEqual([0, 10, 15, 12]);
    expect(component.weeklyDeltaPercent).toBe(-20);
  });

  it('switches cleanly between weekly and period comparison modes', () => {
    const items = [
      new ComparativeConsumption({ id: 1, month: 'Nov', currentPeriod: 90, previousPeriod: 100 })
    ];
    const histories = [
      new ConsumptionHistory({ id: 1, date: '2026-11-20', consumption: '20.00 kWh', cost: 'S/ 14.00', status: 'Normal' })
    ];
    component.items = items;
    component.histories = histories;
    component.ngOnChanges({
      items: new SimpleChange([], items, true),
      histories: new SimpleChange([], histories, true)
    });

    component.setViewMode('period');
    expect(component.viewMode).toBe('period');
    expect(component.weeklyDeltaPercent).toBeNull();
    expect(component.barChartData.labels).toEqual(['Nov']);
    expect(component.barChartData.datasets[1].data).toEqual([90]);
  });
});

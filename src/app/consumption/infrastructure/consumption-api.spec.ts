import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ConsumptionApi } from './consumption-api';
import { environment } from '../../../environments/environment';

describe('ConsumptionApi (Spring Boot DTO Mapping)', () => {
  let api: ConsumptionApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    api = TestBed.inject(ConsumptionApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fold Backend point-based EnergyReadingResource array into chart labels and values', () => {
    let labels: string[] = [];
    let values: number[] = [];

    api.getEnergyReadings('semana').subscribe((reading) => {
      labels = reading.labels;
      values = reading.values;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.energyReadingsEndpointPath}?period=semana`
    );
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, label: 'Lun', kwh: 4.256, powerKw: 0.4, cost: 2.98 },
      { id: 2, label: 'Mar', kwh: 5.5, powerKw: 0.5, cost: 3.85 }
    ]);

    expect(labels).toEqual(['Lun', 'Mar']);
    expect(values).toEqual([4.26, 5.5]);
  });

  it('should map Backend ConsumptionSummaryResource into ConsumptionSummary entity', () => {
    let totalKwh = 0;
    let currentPower = 0;
    let avoidedEmissions = 0;

    api.getSummary('mes').subscribe((summary) => {
      totalKwh = summary?.totalConsumption ?? 0;
      currentPower = summary?.currentPower ?? 0;
      avoidedEmissions = summary?.avoidedEmissionsKg ?? 0;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.consumptionSummariesEndpointPath}?period=mes`
    );
    req.flush({
      userId: 3,
      period: 'MONTHLY',
      totalKwh: 142.8,
      totalCost: 99.96,
      averagePowerKw: 1.25,
      peakPowerKw: 2.8,
      variationPercentage: -12.4,
      avoidedEmissionsKg: 10.5,
      activeDevicesCount: 4
    });

    expect(totalKwh).toBe(142.8);
    expect(currentPower).toBe(1.25);
    expect(avoidedEmissions).toBeCloseTo(10.5, 1);
  });

  it('should map Backend DeviceDistributionResource and ComparativeConsumptionResource arrays', () => {
    let distName = '';
    let distColor = '';
    api.getDeviceDistribution('mes').subscribe((items) => {
      distName = items[0].name;
      distColor = items[0].color;
    });

    const distReq = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.deviceDistributionsEndpointPath}?period=mes`
    );
    distReq.flush([
      { deviceId: 9, deviceName: 'Refrigeradora', category: 'Cocina', totalKwh: 42.3, percentage: 55.2 }
    ]);
    expect(distName).toBe('Refrigeradora');
    expect(distColor).toBe('#10b981');

    let label = '';
    let curr = 0;
    api.getComparativeConsumption('mes').subscribe((items) => {
      label = items[0].month;
      curr = items[0].currentPeriod;
    });

    const compReq = httpMock.expectOne(
      `${environment.apiBaseUrl}${environment.comparativeConsumptionsEndpointPath}?period=mes`
    );
    compReq.flush([
      { label: 'Sem 1', currentPeriodKwh: 32.1, previousPeriodKwh: 38.4, differencePercentage: -16.4 }
    ]);
    expect(label).toBe('Sem 1');
    expect(curr).toBe(32.1);
  });
});

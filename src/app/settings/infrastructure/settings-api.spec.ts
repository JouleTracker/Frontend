import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { HomeConfigurationApi } from './home-configuration.api';
import { NotificationPreferencesApi } from './notification-preferences.api';
import { MonthlyConsumptionThresholdApi } from './monthly-consumption-threshold.api';

describe('Settings API integration contracts', () => {
  let http: HttpTestingController;
  let homeApi: HomeConfigurationApi;
  let notificationsApi: NotificationPreferencesApi;
  let thresholdApi: MonthlyConsumptionThresholdApi;

  const base = environment.apiBaseUrl;

  const home = {
    userId: 1,
    homeType: 'Apartment' as const,
    occupants: 4,
    location: 'Chorrillos',
    tariff: 'BT5B',
    configured: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    homeApi = TestBed.inject(HomeConfigurationApi);
    notificationsApi = TestBed.inject(NotificationPreferencesApi);
    thresholdApi = TestBed.inject(MonthlyConsumptionThresholdApi);
  });

  afterEach(() => {
    http.verify();
  });

  it('should load persisted home configuration', () => {
    homeApi.getConfiguration().subscribe(result => {
      expect(result).toEqual(home);
    });

    const req = http.expectOne(
      `${base}/api/v1/monitoring-spaces/home`
    );

    expect(req.request.method).toBe('GET');
    req.flush(home);
  });

  it('should save home configuration without client user ID', () => {
    const payload = {
      homeType: 'Apartment' as const,
      occupants: 4,
      location: 'Chorrillos',
      tariff: 'BT5B'
    };

    homeApi.updateConfiguration(payload).subscribe(result => {
      expect(result.configured).toBe(true);
    });

    const req = http.expectOne(
      `${base}/api/v1/monitoring-spaces/home`
    );

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    expect(req.request.body.userId).toBeUndefined();

    req.flush(home);
  });

  it('should retrieve default home configuration', () => {
    const response = {
      userId: 1,
      homeType: 'House',
      occupants: 1,
      location: '',
      tariff: '',
      configured: false
    };

    homeApi.getConfiguration().subscribe(result => {
      expect(result.configured).toBe(false);
      expect(result.occupants).toBe(1);
    });

    http.expectOne(
      `${base}/api/v1/monitoring-spaces/home`
    ).flush(response);
  });

  it('should load notification channels', () => {
    const preferences = {
      userId: 1,
      emailEnabled: true,
      whatsappEnabled: false
    };

    notificationsApi.getPreferences().subscribe(result => {
      expect(result).toEqual(preferences);
    });

    const req = http.expectOne(
      `${base}/api/v1/notification-preferences`
    );

    expect(req.request.method).toBe('GET');
    req.flush(preferences);
  });

  it('should persist email and WhatsApp preferences', () => {
    const payload = {
      emailEnabled: true,
      whatsappEnabled: true
    };

    notificationsApi.updatePreferences(payload).subscribe(result => {
      expect(result.emailEnabled).toBe(true);
      expect(result.whatsappEnabled).toBe(true);
    });

    const req = http.expectOne(
      `${base}/api/v1/notification-preferences`
    );

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({ userId: 1, ...payload });
  });

  it('should allow disabling both notification channels', () => {
    const payload = {
      emailEnabled: false,
      whatsappEnabled: false
    };

    notificationsApi.updatePreferences(payload).subscribe(result => {
      expect(result.emailEnabled).toBe(false);
      expect(result.whatsappEnabled).toBe(false);
    });

    const req = http.expectOne(
      `${base}/api/v1/notification-preferences`
    );

    expect(req.request.body).toEqual(payload);
    req.flush({ userId: 1, ...payload });
  });

  it('should retrieve an unconfigured monthly threshold', () => {
    thresholdApi.getThreshold().subscribe(result => {
      expect(result.configured).toBe(false);
      expect(result.monthlyLimitKwh).toBeNull();
    });

    const req = http.expectOne(
      `${base}/api/v1/monthly-consumption-threshold`
    );

    expect(req.request.method).toBe('GET');

    req.flush({
      userId: 1,
      monthlyLimitKwh: null,
      configured: false
    });
  });

  it('should update the monthly threshold', () => {
    const payload = { monthlyLimitKwh: 250.125 };

    thresholdApi.updateThreshold(payload).subscribe(result => {
      expect(result.monthlyLimitKwh).toBe(250.125);
      expect(result.configured).toBe(true);
    });

    const req = http.expectOne(
      `${base}/api/v1/monthly-consumption-threshold`
    );

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      userId: 1,
      ...payload,
      configured: true
    });
  });

  it('should retrieve monthly consumption status', () => {
    const status = {
      userId: 1,
      period: '2026-11',
      configured: true,
      monthlyLimitKwh: 250,
      currentConsumptionKwh: 300,
      remainingKwh: 0,
      consumptionPercentage: 120,
      thresholdReached: true
    };

    thresholdApi.getStatus().subscribe(result => {
      expect(result).toEqual(status);
      expect(result.thresholdReached).toBe(true);
    });

    const req = http.expectOne(
      `${base}/api/v1/monthly-consumption-threshold/status`
    );

    expect(req.request.method).toBe('GET');
    req.flush(status);
  });

  it('should propagate authentication errors', () => {
    let status = 0;

    homeApi.getConfiguration().subscribe({
      next: () => {
        throw new Error('Unexpected successful response');
      },
      error: error => {
        status = error.status;
      }
    });

    http.expectOne(
      `${base}/api/v1/monitoring-spaces/home`
    ).flush(null, {
      status: 401,
      statusText: 'Unauthorized'
    });

    expect(status).toBe(401);
  });
});

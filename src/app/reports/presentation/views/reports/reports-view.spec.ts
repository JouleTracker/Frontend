import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ReportsStore } from '../../../application/reports.store';
import { ReportsApi } from '../../../infrastructure/reports-api';
import { IamStore } from '../../../../iam/application/iam.store';

describe('ReportsStore', () => {
  const records = [
    { id: 3, date: '2026-10-03', consumptionKwh: 20 },
    { id: 1, date: '2026-10-01', consumptionKwh: 4 },
    { id: 2, date: '2026-10-02', consumptionKwh: 8 },
  ];

  function setup(historyLimit: number): ReportsStore {
    TestBed.configureTestingModule({
      providers: [
        ReportsStore,
        { provide: ReportsApi, useValue: { getConsumptionRecords: () => of(records) } },
        {
          provide: IamStore,
          useValue: { historyDaysLimit: signal(historyLimit), currentPlan: signal('plus') },
        },
      ],
    });
    return TestBed.inject(ReportsStore);
  }

  it('carga los registros del usuario y calcula las métricas desde los datos reales', () => {
    const store = setup(30);
    store.loadInitialData();

    expect(store.total()).toBe(32);
    expect(store.average()).toBeCloseTo(32 / 3);
    expect(store.peak()).toBe(20);
    expect(store.rate()).toBe(0.7);
  });

  it('aplica por defecto el rango máximo permitido por el plan', () => {
    const store = setup(7);
    store.loadInitialData();

    expect(store.applied().start).toBe('2026-10-01');
    expect(store.applied().end).toBe('2026-10-03');
    expect(store.filtered().length).toBe(3);
  });

  it('rechaza rangos de fechas inválidos', () => {
    const store = setup(30);
    store.loadInitialData();

    expect(store.applyCustomRange('2026-10-10', '2026-10-01')).toBe(false);
    expect(store.error()).toContain('posterior');

    expect(store.applyCustomRange('', '')).toBe(false);
    expect(store.error()).toContain('ambas fechas');
  });
});

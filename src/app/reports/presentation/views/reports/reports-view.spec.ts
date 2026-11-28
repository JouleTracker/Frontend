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
    expect(store.error()).toContain('later than end date');

    expect(store.applyCustomRange('', '')).toBe(false);
    expect(store.error()).toContain('both dates');
  });

  it('genera CSV desde los registros filtrados y ejecuta exportCsv / exportPdf', () => {
    let exportedRange: { from?: string; to?: string } = {};
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ReportsStore,
        {
          provide: ReportsApi,
          useValue: {
            getConsumptionRecords: () => of(records),
            exportConsumptionCsv: (from?: string, to?: string) => {
              exportedRange = { from, to };
              return of(new Blob(['date,consumptionKwh\n'], { type: 'text/csv' }));
            },
          },
        },
        {
          provide: IamStore,
          useValue: { historyDaysLimit: signal(30), currentPlan: signal('plus') },
        },
      ],
    });

    const store = TestBed.inject(ReportsStore);
    store.loadInitialData();

    const csv = store.buildCsvFromFiltered();
    expect(csv).toContain('date,consumptionKwh,estimatedCostPen');
    expect(csv).toContain('2026-10-01,4.00,2.80');
    expect(csv).toContain('2026-10-03,20.00,14.00');

    store.exportCsv();
    expect(exportedRange.from).toBe('2026-10-01');
    expect(exportedRange.to).toBe('2026-10-03');
    expect(store.isExporting()).toBe(false);

    const html = store.buildPrintableReportHtml();
    expect(html).toContain('JouleTracker — Consumption Report');
    expect(html).toContain('2026-10-01');
  });
});

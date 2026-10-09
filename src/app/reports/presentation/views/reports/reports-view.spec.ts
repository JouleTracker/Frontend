import { TestBed } from '@angular/core/testing';
import { ReportsView } from './reports-view';

describe('ReportsView', () => {
  it('filters inclusively and calculates the summary from the selected records', () => {
    const page = new ReportsView();
    page.records.set([{ date: '2026-10-01', consumptionKwh: 4 }, { date: '2026-10-02', consumptionKwh: 8 }, { date: '2026-10-03', consumptionKwh: 20 }]);
    page.startDate = '2026-10-01';
    page.endDate = '2026-10-02';
    page.applyFilters();
    expect(page.filtered().length).toBe(2);
    expect(page.total()).toBe(12);
    expect(page.average()).toBe(6);
    expect(page.peak()).toBe(8);
    expect(page.total() * page.rate).toBe(9);
  });

  it('preserves the applied range when invalid dates are submitted', () => {
    const page = new ReportsView();
    const previous = page.applied();
    page.startDate = '2026-10-10';
    page.endDate = '2026-10-01';
    page.applyFilters();
    expect(page.error()).toContain('posterior');
    expect(page.applied()).toEqual(previous);
    page.startDate = '';
    page.applyFilters();
    expect(page.error()).toContain('válidas');
  });

  it('renders an empty history and resets to seven days', async () => {
    await TestBed.configureTestingModule({ imports: [ReportsView] }).compileComponents();
    const fixture = TestBed.createComponent(ReportsView);
    fixture.componentInstance.startDate = '2000-01-01';
    fixture.componentInstance.endDate = '2000-01-02';
    fixture.componentInstance.applyFilters();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay datos de consumo disponibles para el periodo seleccionado.');
    expect(fixture.componentInstance.average()).toBe(0);
    fixture.componentInstance.reset();
    fixture.detectChanges();
    expect(fixture.componentInstance.filtered().length).toBe(7);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr').length).toBe(7);
  });
});

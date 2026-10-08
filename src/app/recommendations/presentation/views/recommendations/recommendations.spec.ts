import { TestBed } from '@angular/core/testing';
import { Recommendations } from './recommendations';

describe('Recommendations', () => {
  it('renders the demo cards and the insufficient-data state', async () => {
    await TestBed.configureTestingModule({ imports: [Recommendations] }).compileComponents();
    const fixture = TestBed.createComponent(Recommendations);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.recommendation').length).toBe(4);
    fixture.componentInstance.recommendations.set([]);
    fixture.detectChanges();
    expect(element.textContent).toContain('Aún no hay suficientes datos de consumo para generar recomendaciones.');
  });
});

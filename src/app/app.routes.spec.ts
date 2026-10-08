import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('Application navigation', () => {
  it('loads both screens, activates the sidebar, preserves aliases and existing routes', async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter(routes)] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    for (const [path, title] of [['/reports', 'Reportes'], ['/recommendations', 'Recomendaciones']]) {
      await router.navigateByUrl(path);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('h1')?.textContent).toBe(title);
      expect(element.querySelector('a.active')?.getAttribute('href')).toBe(path);
    }
    for (const [alias, canonical] of [['/reportes', '/reports'], ['/recomendaciones', '/recommendations']]) {
      await router.navigateByUrl(alias);
      expect(router.url).toBe(canonical);
    }
    for (const path of ['/inicio', '/consumo', '/dispositivos', '/alertas', '/configuracion']) {
      await router.navigateByUrl(path);
      fixture.detectChanges();
      expect(router.url).toBe(path);
      expect((fixture.nativeElement as HTMLElement).querySelector('app-blank-page')).toBeTruthy();
    }
  });
});

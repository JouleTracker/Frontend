import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { AdminAlertsComponent } from './admin-alerts';

describe('AdminAlertsComponent', () => {
  let component: AdminAlertsComponent;
  let fixture: ComponentFixture<AdminAlertsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAlertsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAlertsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const usersReq = httpMock.expectOne((req) => req.url.endsWith('/users') || req.url.includes('/api/v1/users'));
    usersReq.flush([
      { id: 2, name: 'Ana', email: 'ana@test.com', role: 'user' },
      { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }
    ]);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send targeted alert payload when broadcast is false', () => {
    component.form.broadcast = false;
    component.form.userId = 2;
    component.form.title = 'High Consumption';
    component.form.description = 'Reduce evening HVAC load';
    component.form.severity = 'warning';

    component.submit();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.alertsEndpointPath}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      userId: 2,
      broadcast: false,
      title: 'High Consumption',
      description: 'Reduce evening HVAC load',
      message: 'Reduce evening HVAC load',
      severity: 'warning',
      actionUrl: '/consumo'
    });
    req.flush({ id: 10 });
  });

  it('should send global broadcast payload with userId null when broadcast is true', () => {
    component.form.broadcast = true;
    component.form.title = 'System Notice';
    component.form.description = 'Grid peak tariff starts at 18:00';
    component.form.severity = 'info';

    component.submit();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.alertsEndpointPath}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.broadcast).toBe(true);
    expect(req.request.body.userId).toBeNull();
    req.flush([{ id: 11 }, { id: 12 }]);
  });
});

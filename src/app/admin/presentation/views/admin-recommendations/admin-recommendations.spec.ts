import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { AdminRecommendationsComponent } from './admin-recommendations';

describe('AdminRecommendationsComponent', () => {
  let component: AdminRecommendationsComponent;
  let fixture: ComponentFixture<AdminRecommendationsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRecommendationsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRecommendationsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const usersReq = httpMock.expectOne((req) => req.url.endsWith('/users') || req.url.includes('/api/v1/users'));
    usersReq.flush([
      { id: 2, name: 'Ana', email: 'ana@test.com', role: 'user' }
    ]);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send canonical estimatedSavingKwh and estimatedSavingAmount payload', () => {
    component.form.userId = 2;
    component.form.title = 'Upgrade Lighting';
    component.form.category = 'Lighting';
    component.form.estimatedSavingsKwh = 10;
    component.form.description = 'Switch office tubes to LED.';

    component.submit();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.recommendationsEndpointPath}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      userId: 2,
      title: 'Upgrade Lighting',
      description: 'Switch office tubes to LED.',
      estimatedSavingKwh: 10,
      estimatedSavingAmount: 7,
      category: 'Lighting'
    });
    req.flush({ id: 5 });
  });
});

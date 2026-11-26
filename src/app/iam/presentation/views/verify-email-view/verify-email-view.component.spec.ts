import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { VerifyEmailViewComponent } from './verify-email-view.component';
import { environment } from '../../../../../environments/environment';

describe('VerifyEmailViewComponent', () => {
  function setup(queryParams: Record<string, string>) {
    TestBed.configureTestingModule({
      imports: [VerifyEmailViewComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } }
        }
      ]
    });

    const fixture: ComponentFixture<VerifyEmailViewComponent> = TestBed.createComponent(
      VerifyEmailViewComponent
    );
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      httpMock: TestBed.inject(HttpTestingController)
    };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should lock the email input as readonly when email query parameter is provided', () => {
    const { fixture, component, httpMock } = setup({
      pending: '1',
      email: 'rodrigo@example.com'
    });

    expect(component.isEmailLocked()).toBe(true);
    expect(component.pendingEmail()).toBe('rodrigo@example.com');

    const input = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.value).toBe('rodrigo@example.com');

    component.onResendVerification();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.resendCodeEndpointPath}`);
    expect(req.request.body).toEqual({ email: 'rodrigo@example.com' });
    req.flush({});
    httpMock.verify();
  });

  it('should keep the email input editable when no email query parameter is provided', () => {
    const { fixture, component, httpMock } = setup({ pending: '1' });

    expect(component.isEmailLocked()).toBe(false);

    const input = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    expect(input.readOnly).toBe(false);

    component.resendForm.setValue({ email: 'otro@example.com' });
    component.onResendVerification();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.resendCodeEndpointPath}`);
    expect(req.request.body).toEqual({ email: 'otro@example.com' });
    req.flush({});
    httpMock.verify();
  });
});

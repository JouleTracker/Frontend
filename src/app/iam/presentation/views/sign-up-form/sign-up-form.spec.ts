import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SignUpFormComponent } from './sign-up-form';
import { environment } from '../../../../../environments/environment';

describe('SignUpFormComponent', () => {
  let component: SignUpFormComponent;
  let fixture: ComponentFixture<SignUpFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enforce Spring Boot password policy with any non-alphanumeric special character', () => {
    const passwordControl = component.passwordControl;
    passwordControl?.setValue('Abc1234');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('Abcdefg1');
    expect(passwordControl?.hasError('pattern')).toBe(true);

    passwordControl?.setValue('Abcd 12!');
    expect(passwordControl?.hasError('pattern')).toBe(true);

    for (const valid of ['Abcdef1!', 'Abcdef1@', 'Abcdef1_', 'Abcdef1-', 'Abcdef1#', 'Abcdef1.']) {
      passwordControl?.setValue(valid);
      expect(passwordControl?.valid).toBe(true);
    }
  });

  it('should render 400 Bad Request ProblemDetail validation errors in the alert banner', () => {
    component.registerForm.setValue({
      name: 'Ana Perez',
      email: 'ana@example.com',
      accountType: 'homeowner',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      acceptTerms: true
    });

    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.registerEndpointPath}`);
    req.flush(
      {
        title: 'Bad Request',
        detail: 'Validation failed',
        errors: { password: 'La contraseña no cumple la política de seguridad.' }
      },
      { status: 400, statusText: 'Bad Request' }
    );

    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.error-banner') as HTMLElement | null;
    expect(banner?.textContent).toContain('La contraseña no cumple la política de seguridad.');
  });

  it('should render 409 Conflict duplicate email errors in the alert banner', () => {
    component.registerForm.setValue({
      name: 'Ana Perez',
      email: 'duplicado@example.com',
      accountType: 'homeowner',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      acceptTerms: true
    });

    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}${environment.registerEndpointPath}`);
    req.flush(
      { detail: 'El correo electrónico ya está registrado.' },
      { status: 409, statusText: 'Conflict' }
    );

    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.error-banner') as HTMLElement | null;
    expect(banner?.textContent).toContain('El correo electrónico ya está registrado.');
  });
});

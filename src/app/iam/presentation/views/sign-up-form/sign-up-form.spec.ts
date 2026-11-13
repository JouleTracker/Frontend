import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SignUpFormComponent } from './sign-up-form';

describe('SignUpFormComponent', () => {
  let component: SignUpFormComponent;
  let fixture: ComponentFixture<SignUpFormComponent>;

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
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enforce Spring Boot password policy (min 8 chars + special character)', () => {
    const passwordControl = component.passwordControl;
    passwordControl?.setValue('Abc1234');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('Abcdefg1');
    expect(passwordControl?.hasError('pattern')).toBe(true);

    passwordControl?.setValue('Abcdef1!');
    expect(passwordControl?.valid).toBe(true);
  });
});

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../application/auth.service';
import { Sidebar } from '../../../../shared/presentation/components/sidebar/sidebar';

/**
 * Custom validator: checks that password and confirmPassword match.
 */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

/**
 * Register view for JouleTracker.
 *
 * Split-screen layout: registration form on the left, promotional content on the right.
 */
@Component({
  selector: 'app-register-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-view.component.html',
  styleUrl: './register-view.component.css',
})
export class RegisterViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  /** Password visibility toggles. */
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  /** Whether a registration request is in progress. */
  readonly isLoading = signal(false);

  /** Error message to display. */
  readonly errorMessage = signal('');

  /** Registration form. */
  readonly registerForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatchValidator },
  );

  /** Toggles password visibility. */
  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  /** Toggles confirm password visibility. */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  /** Submits the registration form. */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { name, email, password } = this.registerForm.getRawValue();

    this.authService.register({ name, email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'No se pudo crear la cuenta. Inténtalo de nuevo.',
        );
      },
    });
  }
}

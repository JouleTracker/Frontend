import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../auth/application/auth.service';

/**
 * Forgot password view for JouleTracker.
 *
 * Centered card layout on a soft green background with organic shapes.
 */
@Component({
  selector: 'app-forgot-password-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-view.component.html',
  styleUrl: './forgot-password-view.component.css'
})
export class ForgotPasswordViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  /** Whether a recovery request is in progress. */
  readonly isLoading = signal(false);

  /** Whether the recovery email has been sent. */
  readonly emailSent = signal(false);

  /** Error message to display. */
  readonly errorMessage = signal('');

  /** Forgot password form. */
  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /** Submits the forgot password form. */
  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email } = this.forgotForm.getRawValue();

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.emailSent.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'No se pudo enviar el enlace. Verifica tu correo.'
        );
      }
    });
  }
}

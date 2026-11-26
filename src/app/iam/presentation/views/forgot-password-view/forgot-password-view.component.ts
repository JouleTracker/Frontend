import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamApi } from '../../../infrastructure/iam-api';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * Step 1 of the US-03 Password Recovery flow.
 * Submits the user's email to `POST /api/v1/authentication/forgot-password` and displays
 * a clear anti-enumeration confirmation banner on completion.
 */
@Component({
  selector: 'app-forgot-password-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password-view.component.html',
  styleUrl: './forgot-password-view.component.css'
})
export class ForgotPasswordViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly iamApi = inject(IamApi);
  private readonly translate = inject(TranslateService);

  readonly isLoading = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);
  readonly submittedEmail = signal<string>('');
  readonly errorMessage = signal<string | null>(null);

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get emailControl() {
    return this.emailForm.get('email');
  }

  onSubmit(): void {
    if (this.emailForm.invalid || this.isLoading()) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.value.email!.trim().toLowerCase();
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.iamApi.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submittedEmail.set(email);
        this.isSubmitted.set(true);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const fallback = this.translateOrFallback(
          'AUTH.FORGOT_ERROR_DEFAULT',
          'No se pudo procesar tu solicitud de recuperación en este momento.'
        );
        this.errorMessage.set(extractHttpErrorMessage(err, fallback));
      }
    });
  }

  private translateOrFallback(key: string, fallback: string): string {
    const value = this.translate.instant(key);
    return value && value !== key ? value : fallback;
  }

  resetForm(): void {
    this.isSubmitted.set(false);
    this.errorMessage.set(null);
    this.emailForm.reset();
  }
}

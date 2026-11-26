import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamApi } from '../../../infrastructure/iam-api';
import {
  createPasswordMatchValidator,
  passwordPolicyValidators
} from '../../../domain/model/password-policy';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * Step 2 of the US-03 Password Recovery flow (`/reset-password?token=...`).
 * Reads the reset token from URL query parameters, validates the new password
 * against the platform policy, calls `POST /api/v1/authentication/reset-password`,
 * and redirects to `/login` on success.
 */
@Component({
  selector: 'app-reset-password-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password-view.component.html',
  styleUrl: './reset-password-view.component.css'
})
export class ResetPasswordViewComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly iamApi = inject(IamApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly token = signal<string | null>(null);
  readonly status = signal<'form' | 'missing-token' | 'success'>('form');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  readonly resetForm = this.fb.group(
    {
      newPassword: ['', passwordPolicyValidators()],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: createPasswordMatchValidator('newPassword', 'confirmPassword') }
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.redirectTimer) {
        clearTimeout(this.redirectTimer);
      }
    });
  }

  ngOnInit(): void {
    const rawToken = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!rawToken) {
      this.status.set('missing-token');
      return;
    }
    this.token.set(rawToken);
  }

  get newPasswordControl() {
    return this.resetForm.get('newPassword');
  }

  get confirmPasswordControl() {
    return this.resetForm.get('confirmPassword');
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || this.isLoading()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const tokenValue = this.token();
    if (!tokenValue) {
      this.status.set('missing-token');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.iamApi.resetPassword(tokenValue, this.resetForm.value.newPassword!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.status.set('success');
        this.redirectTimer = setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { passwordReset: '1' } });
        }, 2000);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const fallback = this.translateOrFallback(
          'AUTH.RESET_ERROR_DEFAULT',
          'El enlace de restablecimiento es inválido o ha expirado. Solicita un nuevo correo de recuperación.'
        );
        this.errorMessage.set(extractHttpErrorMessage(err, fallback));
      }
    });
  }

  private translateOrFallback(key: string, fallback: string): string {
    const value = this.translate.instant(key);
    return value && value !== key ? value : fallback;
  }
}

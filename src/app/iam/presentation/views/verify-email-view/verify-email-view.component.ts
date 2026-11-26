import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamApi } from '../../../infrastructure/iam-api';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * US-04 Account Verification view (`/verify-email`).
 *
 * Handles both:
 * 1. Token verification links (`/verify-email?token=...`) via `GET /api/v1/authentication/verify-email`.
 * 2. Post-registration verification notices (`/verify-email?pending=1&email=...`) and resend
 *    requests via `POST /api/v1/authentication/resend-verification`.
 */
@Component({
  selector: 'app-verify-email-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="verify-page">
      <div class="verify-card">
        @if (status() === 'loading') {
          <div class="status-badge loading">{{ 'AUTH.VERIFY_BADGE_LOADING' | translate }}</div>
          <h1 class="verify-title">{{ 'AUTH.VERIFY_LOADING_TITLE' | translate }}</h1>
          <p class="verify-subtitle">{{ 'AUTH.VERIFY_LOADING_SUBTITLE' | translate }}</p>
        }

        @if (status() === 'success') {
          <div class="status-badge success">{{ 'AUTH.VERIFY_BADGE_SUCCESS' | translate }}</div>
          <h1 class="verify-title">{{ 'AUTH.VERIFY_SUCCESS_TITLE' | translate }}</h1>
          <p class="verify-subtitle">{{ 'AUTH.VERIFY_SUCCESS_SUBTITLE' | translate }}</p>
          <a routerLink="/login" class="btn-primary">{{ 'AUTH.GO_TO_SIGN_IN' | translate }}</a>
        }

        @if (status() === 'pending') {
          <div class="status-badge pending">{{ 'AUTH.VERIFY_BADGE_PENDING' | translate }}</div>
          <h1 class="verify-title">{{ 'AUTH.VERIFY_PENDING_TITLE' | translate }}</h1>
          <p class="verify-subtitle">
            @if (pendingEmail()) {
              {{ 'AUTH.VERIFY_PENDING_SUBTITLE_EMAIL' | translate: { email: pendingEmail() } }}
            } @else {
              {{ 'AUTH.VERIFY_PENDING_SUBTITLE' | translate }}
            }
          </p>
        }

        @if (status() === 'error') {
          <div class="status-badge error">{{ 'AUTH.VERIFY_BADGE_ERROR' | translate }}</div>
          <h1 class="verify-title">{{ 'AUTH.VERIFY_ERROR_TITLE' | translate }}</h1>
          <p class="verify-subtitle">{{ errorMessage() || ('AUTH.VERIFY_ERROR_DEFAULT' | translate) }}</p>
        }

        @if (status() === 'pending' || status() === 'error') {
          <div class="resend-section">
            <p class="resend-label">{{ 'AUTH.RESEND_PROMPT' | translate }}</p>

            <form [formGroup]="resendForm" (ngSubmit)="onResendVerification()" class="resend-form" novalidate>
              <div class="input-wrapper">
                <input
                  type="email"
                  formControlName="email"
                  [placeholder]="'AUTH.EMAIL_LABEL' | translate"
                  class="field-input"
                  [class.field-locked]="isEmailLocked()"
                  [class.input-error]="emailControl?.invalid && emailControl?.touched"
                  [readonly]="isEmailLocked()"
                  [attr.aria-readonly]="isEmailLocked() ? 'true' : null"
                  autocomplete="email"
                />
                @if (isEmailLocked()) {
                  <span class="lock-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                }
              </div>

              @if (emailControl?.touched && emailControl?.invalid) {
                <div class="field-error" role="alert">
                  @if (emailControl?.errors?.['required']) {
                    <span>{{ 'AUTH.EMAIL_REQUIRED' | translate }}</span>
                  } @else if (emailControl?.errors?.['email']) {
                    <span>{{ 'AUTH.EMAIL_INVALID' | translate }}</span>
                  }
                </div>
              }

              @if (resendSuccess()) {
                <div class="info-banner" role="status">
                  {{ 'AUTH.RESEND_SUCCESS' | translate }}
                </div>
              }

              @if (resendError()) {
                <div class="error-banner" role="alert">{{ resendError() }}</div>
              }

              <button type="submit" class="btn-primary" [disabled]="isResending()">
                @if (isResending()) {
                  <span class="spinner-light" aria-hidden="true"></span>
                  <span>{{ 'AUTH.RESENDING_VERIFICATION' | translate }}</span>
                } @else {
                  <span>{{ 'AUTH.RESEND_VERIFICATION_BTN' | translate }}</span>
                }
              </button>
            </form>
          </div>

          <div class="back-link-wrapper">
            <a routerLink="/login" class="back-link">{{ 'AUTH.BACK_TO_LOGIN' | translate }}</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: #f7faf7;
        font-family: 'Roboto', sans-serif;
      }
      .verify-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
      }
      .verify-card {
        width: 100%;
        max-width: 460px;
        background-color: #dcedd5;
        border: 1px solid #bed4c2;
        border-radius: 20px;
        padding: 36px 32px;
        text-align: center;
        box-shadow: 0 8px 30px rgba(33, 64, 41, 0.08);
        box-sizing: border-box;
      }
      .status-badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: 14px;
      }
      .status-badge.loading {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }
      .status-badge.success {
        background: #bbf7d0;
        color: #166534;
      }
      .status-badge.error {
        background: #fee2e2;
        color: #b91c1c;
      }
      .verify-title {
        font-family: 'Inter', sans-serif;
        font-size: 1.55rem;
        font-weight: 700;
        color: #214029;
        margin: 0 0 10px 0;
      }
      .verify-subtitle {
        font-size: 0.92rem;
        color: #374151;
        margin: 0 0 22px 0;
        line-height: 1.5;
      }
      .resend-section {
        border-top: 1px solid #bed4c2;
        padding-top: 18px;
        margin-top: 4px;
      }
      .resend-label {
        font-size: 0.84rem;
        color: #374151;
        margin: 0 0 12px 0;
        line-height: 1.4;
      }
      .resend-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      .field-input {
        width: 100%;
        height: 44px;
        padding: 0 14px;
        border: 1px solid #bed4c2;
        border-radius: 10px;
        font-size: 0.9rem;
        background-color: #ffffff;
        color: #1a1a1a;
        outline: none;
        box-sizing: border-box;
      }
      .field-input.field-locked {
        background-color: #edf3ee;
        color: #374151;
        padding-right: 38px;
        cursor: not-allowed;
      }
      .field-input.field-locked:focus {
        border-color: #bed4c2;
        box-shadow: none;
      }
      .lock-icon {
        position: absolute;
        right: 12px;
        color: #4b5563;
        display: flex;
        align-items: center;
        pointer-events: none;
      }
      .field-input:focus {
        border-color: #214029;
        box-shadow: 0 0 0 3px rgba(33, 64, 41, 0.15);
      }
      .field-input.input-error {
        border-color: #dc2626;
      }
      .field-error {
        text-align: left;
        font-size: 0.8rem;
        color: #b91c1c;
        margin-top: -6px;
        padding-left: 4px;
      }
      .info-banner {
        background-color: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 0.84rem;
        line-height: 1.4;
      }
      .error-banner {
        background-color: #fee2e2;
        color: #b91c1c;
        border: 1px solid #f87171;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 0.84rem;
        line-height: 1.4;
      }
      .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        height: 46px;
        background-color: #214029;
        color: #ffffff;
        border: none;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .btn-primary:hover:not(:disabled) {
        opacity: 0.92;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .back-link-wrapper {
        margin-top: 18px;
      }
      .back-link {
        color: #214029;
        font-weight: 600;
        font-size: 0.88rem;
        text-decoration: underline;
      }
      .spinner-light {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class VerifyEmailViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly iamApi = inject(IamApi);
  private readonly translate = inject(TranslateService);

  readonly status = signal<'loading' | 'pending' | 'success' | 'error'>('loading');
  readonly pendingEmail = signal<string>('');
  readonly isEmailLocked = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isResending = signal<boolean>(false);
  readonly resendSuccess = signal<boolean>(false);
  readonly resendError = signal<string | null>(null);

  readonly resendForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get emailControl() {
    return this.resendForm.get('email');
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token')?.trim();
    const email = params.get('email')?.trim().toLowerCase() ?? '';
    const isPending = params.get('pending') === '1';

    if (email) {
      this.pendingEmail.set(email);
      this.isEmailLocked.set(true);
      this.resendForm.patchValue({ email });
    }

    if (token) {
      this.verifyToken(token);
      return;
    }

    if (isPending || !token) {
      this.status.set('pending');
    }
  }

  private verifyToken(token: string): void {
    this.status.set('loading');
    this.errorMessage.set(null);

    this.iamApi.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: (err: Error) => {
        this.status.set('error');
        this.errorMessage.set(err.message || null);
      }
    });
  }

  onResendVerification(): void {
    if (this.resendForm.invalid || this.isResending()) {
      this.resendForm.markAllAsTouched();
      return;
    }

    const email = this.isEmailLocked()
      ? this.pendingEmail()
      : this.resendForm.value.email!.trim().toLowerCase();
    this.isResending.set(true);
    this.resendSuccess.set(false);
    this.resendError.set(null);

    this.iamApi.resendVerification(email).subscribe({
      next: () => {
        this.isResending.set(false);
        this.pendingEmail.set(email);
        this.resendSuccess.set(true);
      },
      error: (err: unknown) => {
        this.isResending.set(false);
        const fallback = this.translateOrFallback(
          'AUTH.RESEND_ERROR_DEFAULT',
          'No se pudo reenviar el correo de verificación. Inténtalo más tarde.'
        );
        this.resendError.set(extractHttpErrorMessage(err, fallback));
      }
    });
  }

  private translateOrFallback(key: string, fallback: string): string {
    const value = this.translate.instant(key);
    return value && value !== key ? value : fallback;
  }
}

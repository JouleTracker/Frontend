import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamApi } from '../../../infrastructure/iam-api';

@Component({
  selector: 'app-verify-email-view',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="verify-page">
      <div class="verify-card">
        @if (status() === 'loading') {
          <div class="status-badge loading">{{ 'AUTH.VERIFY.BADGE_LOADING' | translate }}</div>
          <h1 class="verify-title">{{ 'AUTH.VERIFY.TITLE_LOADING' | translate }}</h1>
          <p class="verify-subtitle">{{ 'AUTH.VERIFY.SUB_LOADING' | translate }}</p>
        }

        @if (status() === 'success') {
          <div class="status-badge success">{{ 'AUTH.VERIFY.BADGE_SUCCESS' | translate }}</div>
          <h1 class="verify-title">{{ 'AUTH.VERIFY.TITLE_SUCCESS' | translate }}</h1>
          <p class="verify-subtitle">
            {{ 'AUTH.VERIFY.SUB_SUCCESS' | translate }}
          </p>
          <a routerLink="/login" class="btn-primary">{{ 'AUTH.VERIFY.BTN_LOGIN' | translate }}</a>
        }

        @if (status() === 'error') {
          <div class="status-badge error">{{ 'AUTH.VERIFY.BADGE_ERROR' | translate }}</div>
          <h1 class="verify-title">{{ 'AUTH.VERIFY.TITLE_ERROR' | translate }}</h1>
          <p class="verify-subtitle">{{ errorMessage() }}</p>
          <a routerLink="/login" class="btn-primary">{{ 'AUTH.VERIFY.BTN_BACK_LOGIN' | translate }}</a>
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
      }
      .verify-card {
        width: 100%;
        max-width: 440px;
        background-color: #dcedd5;
        border: 1px solid #bed4c2;
        border-radius: 20px;
        padding: 36px 32px;
        text-align: center;
        box-shadow: 0 8px 30px rgba(33, 64, 41, 0.08);
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
        margin: 0 0 24px 0;
        line-height: 1.5;
      }
      .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 46px;
        background-color: #214029;
        color: #ffffff;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
      }
      .btn-primary:hover {
        opacity: 0.92;
      }
    `
  ]
})
export class VerifyEmailViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly iamApi = inject(IamApi);
  private readonly translate = inject(TranslateService);

  readonly status = signal<'loading' | 'success' | 'error'>('loading');
  readonly errorMessage = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('error');
      this.errorMessage.set(this.translate.instant('AUTH.VERIFY.INVALID_TOKEN'));
      return;
    }

    this.iamApi.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: (err: Error) => {
        this.status.set('error');
        this.errorMessage.set(
          err.message || this.translate.instant('AUTH.VERIFY.EXPIRED_TOKEN')
        );
      }
    });
  }
}

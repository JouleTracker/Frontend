import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/application/auth.service';

/**
 * Verify email view for JouleTracker.
 *
 * Displays a 6-digit OTP input with a resend countdown timer.
 * Shown after user registration.
 */
@Component({
  selector: 'app-verify-email-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email-view.component.html',
  styleUrl: './verify-email-view.component.css'
})
export class VerifyEmailViewComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** The 6 OTP digit values. */
  readonly otpDigits = signal<string[]>(['', '', '', '', '', '']);

  /** Index of the currently focused input. */
  readonly focusedIndex = signal<number | null>(null);

  /** Whether verification is in progress. */
  readonly isLoading = signal(false);

  /** Error message to display. */
  readonly errorMessage = signal('');

  /** Whether the code was successfully sent (resend confirmation). */
  readonly resendSuccess = signal(false);

  /** Resend countdown in seconds. */
  readonly countdown = signal(30);

  /** Whether the resend button is available. */
  readonly canResend = signal(false);

  private timerId: ReturnType<typeof setInterval> | null = null;

  /** The pending email from registration. */
  readonly pendingEmail = this.authService.getPendingEmail();

  constructor() {
    // If no pending email, redirect to register
    if (!this.pendingEmail) {
      this.router.navigate(['/registro']);
    }
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  /** Handles input in an OTP digit field. */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');

    // Only take the last character if multiple were pasted/typed
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const digits = [...this.otpDigits()];
    digits[index] = value;
    this.otpDigits.set(digits);
    this.errorMessage.set('');

    // Move to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  }

  /** Handles keydown for backspace navigation. */
  onDigitKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const digits = [...this.otpDigits()];
      if (!digits[index] && index > 0) {
        // Move to previous input
        digits[index] = '';
        this.otpDigits.set(digits);
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  }

  /** Handles paste event for the full OTP code. */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') ?? '';
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      this.otpDigits.set(newOtp);

      // Focus the next empty input or the last one
      const nextEmpty = newOtp.findIndex((d) => d === '');
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      const input = document.getElementById(`otp-${focusIndex}`) as HTMLInputElement;
      input?.focus();
    }
  }

  /** Returns the full OTP code as a string. */
  get fullCode(): string {
    return this.otpDigits().join('');
  }

  /** Whether all 6 digits are filled. */
  get isComplete(): boolean {
    return this.otpDigits().every((d) => d !== '');
  }

  /** Submits the verification code. */
  onVerify(): void {
    if (!this.isComplete) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.verifyEmail(this.fullCode).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Código inválido. Verifica e inténtalo de nuevo.'
        );
        // Clear the OTP inputs on error
        this.otpDigits.set(['', '', '', '', '', '']);
        const firstInput = document.getElementById('otp-0') as HTMLInputElement;
        firstInput?.focus();
      }
    });
  }

  /** Resends the verification code. */
  onResend(): void {
    if (!this.canResend()) return;

    this.authService.resendCode().subscribe({
      next: () => {
        this.resendSuccess.set(true);
        this.countdown.set(30);
        this.canResend.set(false);
        this.startCountdown();
        setTimeout(() => this.resendSuccess.set(false), 3000);
      }
    });
  }

  // ── Private helpers ───────────────────────────────

  private startCountdown(): void {
    this.clearTimer();
    this.timerId = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        this.canResend.set(true);
        this.clearTimer();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /** Formats the countdown as MM:SS. */
  get formattedCountdown(): string {
    const seconds = this.countdown();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

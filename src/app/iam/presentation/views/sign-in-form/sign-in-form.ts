import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/sign-in.command';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * Primary authentication view handling credential sign-in and post-flow status banners
 * (registration verification notice, password reset success, and account deactivation notice).
 */
@Component({
  selector: 'app-sign-in-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './sign-in-form.html',
  styleUrl: './sign-in-form.css'
})
export class SignInFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly iamStore = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  readonly errorMessage = signal<string | null>(null);
  readonly infoBannerKey = signal<string | null>(null);
  readonly showResendLink = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('registered') === '1') {
      this.infoBannerKey.set('AUTH.REGISTERED_VERIFY_BANNER');
      this.showResendLink.set(true);
    } else if (params.get('passwordReset') === '1') {
      this.infoBannerKey.set('AUTH.PASSWORD_RESET_BANNER');
    } else if (params.get('deactivated') === '1') {
      this.infoBannerKey.set('AUTH.ACCOUNT_DEACTIVATED_BANNER');
    }

    const email = params.get('email');
    if (email) {
      this.loginForm.patchValue({ email });
    }
  }

  get currentEmailQuery(): Record<string, string> {
    return { pending: '1' };
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const command: SignInCommand = {
      email: this.loginForm.value.email!.trim(),
      password: this.loginForm.value.password!
    };

    this.iamStore.signIn(command).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const fallback = this.translateOrFallback(
          'AUTH.SIGN_IN_ERROR_DEFAULT',
          'No se pudo iniciar sesión. Verifica tus credenciales.'
        );
        const msg = extractHttpErrorMessage(err, fallback);
        this.errorMessage.set(msg);
        if (/verif/i.test(msg)) {
          this.showResendLink.set(true);
        }
      }
    });
  }

  private translateOrFallback(key: string, fallback: string): string {
    const value = this.translate.instant(key);
    return value && value !== key ? value : fallback;
  }
}

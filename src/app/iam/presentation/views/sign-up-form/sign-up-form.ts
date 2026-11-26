import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { SignUpCommand } from '../../../domain/model/sign-up.command';
import { UserRole } from '../../../domain/model/user.entity';
import {
  createPasswordMatchValidator,
  passwordPolicyValidators
} from '../../../domain/model/password-policy';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * Account registration view supporting Homeowner and Business (SME) profiles.
 * Redirects newly registered users to `/verify-email` with a post-registration notice.
 */
@Component({
  selector: 'app-sign-up-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-up-form.html',
  styleUrl: './sign-up-form.css'
})
export class SignUpFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const rawType = (
        params.get('accountType') ??
        params.get('type') ??
        params.get('segment') ??
        ''
      )
        .trim()
        .toLowerCase();

      if (rawType === 'business' || rawType === 'mype' || rawType === 'negocio') {
        this.registerForm.patchValue({ accountType: 'business' });
      } else if (
        rawType === 'homeowner' ||
        rawType === 'hogar' ||
        rawType === 'jefe-de-hogar'
      ) {
        this.registerForm.patchValue({ accountType: 'homeowner' });
      }
    });
  }

  readonly registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      accountType: ['homeowner', [Validators.required]],
      password: ['', passwordPolicyValidators()],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    },
    { validators: createPasswordMatchValidator('password', 'confirmPassword') }
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  get nameControl() {
    return this.registerForm.get('name');
  }

  get emailControl() {
    return this.registerForm.get('email');
  }

  get passwordControl() {
    return this.registerForm.get('password');
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  get acceptTermsControl() {
    return this.registerForm.get('acceptTerms');
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const command: SignUpCommand = {
      name: this.registerForm.value.name!.trim(),
      email: this.registerForm.value.email!.trim().toLowerCase(),
      password: this.registerForm.value.password!,
      role: (this.registerForm.value.accountType as UserRole) || 'homeowner',
      plan: 'pro'
    };

    this.iamStore.signUp(command).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/verify-email'], {
          queryParams: { pending: '1', email: command.email }
        });
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const fallback = this.translateOrFallback(
          'AUTH.REGISTER_ERROR_DEFAULT',
          'No se pudo completar el registro. Revisa los datos e inténtalo nuevamente.'
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

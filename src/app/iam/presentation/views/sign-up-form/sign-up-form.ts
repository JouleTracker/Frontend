import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IamStore } from '../../../application/iam.store';
import { SignUpCommand } from '../../../domain/model/sign-up.command';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmControl = control.get('confirmPassword');
  const confirmPassword = confirmControl?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    confirmControl?.setErrors({ ...confirmControl.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  }

  if (confirmControl?.hasError('passwordMismatch')) {
    const errors = { ...confirmControl.errors };
    delete errors['passwordMismatch'];
    confirmControl.setErrors(Object.keys(errors).length ? errors : null);
  }

  return null;
}

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sign-up-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-up-form.html',
  styleUrl: './sign-up-form.css'
})
export class SignUpFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  // 1. Signals declaradas correctamente para coincidir con errorMessage(), isLoading(), etc.
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  readonly registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
        ]
      ],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    },
    { validators: passwordMatchValidator }
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  // Getters para no pasar argumentos si los usas en el HTML
  get passwordControl() {
    return this.registerForm.get('password');
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const command: SignUpCommand = {
      name: this.registerForm.value.name!.trim(),
      email: this.registerForm.value.email!.trim().toLowerCase(),
      password: this.registerForm.value.password!,
      role: 'homeowner'
    };

    this.iamStore.signUp(command).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Error al registrar la cuenta');
      }
    });
  }
}

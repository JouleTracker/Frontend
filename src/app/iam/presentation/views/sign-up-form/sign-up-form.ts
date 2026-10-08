import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
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

@Component({
  selector: 'app-sign-up-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './sign-up-form.html',
  styleUrl: './sign-up-form.css'
})
export class SignUpFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  // Regex para restricciones: al menos 1 mayúscula, 1 minúscula y 1 número
  readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

  readonly registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(this.passwordPattern)
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

  // Verificadores en tiempo real para las restricciones
  get passwordVal(): string {
    return this.registerForm.get('password')?.value || '';
  }

  hasMinLength(): boolean {
    return this.passwordVal.length >= 6;
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.passwordVal);
  }

  hasLowerCase(): boolean {
    return /[a-z]/.test(this.passwordVal);
  }

  hasNumber(): boolean {
    return /\d/.test(this.passwordVal);
  }

  onSubmit(): void {
    console.log('--- INTENTO DE REGISTRO ---');
    console.log('Formulario válido?:', this.registerForm.valid);

    if (this.registerForm.invalid) {
      console.warn('Errores del campo password:', this.registerForm.get('password')?.errors);
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
      next: (res) => {
        console.log('Registro exitoso:', res);
        this.isLoading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err: Error) => {
        console.error('Error al registrarse:', err);
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Error al registrar la cuenta');
      }
    });
  }
}

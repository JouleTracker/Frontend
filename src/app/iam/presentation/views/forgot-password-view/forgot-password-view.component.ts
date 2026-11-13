import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password-view.component.html',
  styleUrl: './forgot-password-view.component.css'
})
export class ForgotPasswordViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly usersUrl = `${environment.apiBaseUrl}/users`;

  readonly step = signal<'email' | 'new-password' | 'success'>('email');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  private userId: number | string | null = null;

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onCheckEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(false);
    this.errorMessage.set(
      'La recuperación de contraseña por correo estará disponible próximamente. Si necesitas ayuda, contacta al administrador.'
    );
  }

  onResetPassword(): void {
    if (this.resetForm.invalid || !this.userId) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(false);
    this.errorMessage.set(
      'El restablecimiento directo no está habilitado desde el navegador por seguridad.'
    );
  }
}

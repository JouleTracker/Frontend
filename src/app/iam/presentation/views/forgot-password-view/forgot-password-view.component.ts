import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-forgot-password-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.emailForm.value.email!.trim().toLowerCase();

    this.http.get<any[]>(`${this.usersUrl}?email=${email}`).subscribe({
      next: (users) => {
        this.isLoading.set(false);
        if (users.length > 0) {
          this.userId = users[0].id;
          this.step.set('new-password');
        } else {
          this.errorMessage.set('No encontramos ninguna cuenta con ese correo.');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error de conexión con el servidor.');
      }
    });
  }

  onResetPassword(): void {
    if (this.resetForm.invalid || !this.userId) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const newPassword = this.resetForm.value.newPassword!;

    this.http.patch(`${this.usersUrl}/${this.userId}`, { password: newPassword }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set('success');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo actualizar la contraseña.');
      }
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/sign-in.command';

import { TranslatePipe } from '@ngx-translate/core';

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

  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  // Asegúrate de que SOLO email y password tengan Validators.required
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('registered') === '1') {
      this.infoMessage.set(
        '¡Cuenta creada! Revisa tu bandeja de correo y abre el enlace de verificación antes de iniciar sesión.'
      );
    }
    const email = params.get('email');
    if (email) {
      this.loginForm.patchValue({ email });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  onSubmit(): void {
    console.log('--- INTENTO DE SUBMIT ---');
    console.log('Validez del formulario:', this.loginForm.valid);
    console.log('Valores:', this.loginForm.value);
    console.log('Errores en formulario:', this.loginForm.errors);

    if (this.loginForm.invalid) {
      console.warn('Formulario inválido. Errores por control:');
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control?.invalid) {
          console.warn(`Control [${key}] tiene errores:`, control.errors);
        }
      });
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const command: SignInCommand = {
      email: this.loginForm.value.email!.trim(),
      password: this.loginForm.value.password!
    };

    console.log('Enviando command a IamStore:', command);

    this.iamStore.signIn(command).subscribe({
      next: (res) => {
        console.log('Login exitoso en IamStore:', res);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('Error capturado en login:', err);
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Error al iniciar sesión');
      }
    });
  }
}

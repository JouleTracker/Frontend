import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IamStore } from '../../../../iam/application/iam.store';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { UserNotifications } from '../../../../iam/domain/model/user.entity';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-configuration-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslatePipe
  ],
  templateUrl: './configuration-view.component.html',
  styleUrl: './configuration-view.component.css'
})
export class ConfigurationViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly iamStore = inject(IamStore);
  private readonly iamApi = inject(IamApi);
  private readonly router = inject(Router);

  readonly user = this.iamStore.currentUser;
  readonly currentPlan = this.iamStore.currentPlan;

  // Formulario Información Personal (datos reales del usuario en db.json)
  readonly profileForm = this.fb.group({
    fullName: [this.user()?.name ?? '', Validators.required],
    email: [this.user()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.user()?.phone ?? '']
  });

  // Formulario Cambiar Contraseña
  readonly passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  // Formulario Mi Hogar (persistido en el perfil del usuario en db.json)
  readonly homeForm = this.fb.group({
    homeType: [this.user()?.home?.homeType ?? 'Casa'],
    occupants: [this.user()?.home?.occupants ?? 1],
    location: [this.user()?.home?.location ?? ''],
    tariff: [this.user()?.home?.tariff ?? '']
  });

  // Notificaciones (preferencias del usuario persistidas en db.json)
  readonly highConsumptionAlerts = signal(this.user()?.notifications?.highConsumptionAlerts ?? true);
  readonly maintenanceReminders = signal(this.user()?.notifications?.maintenanceReminders ?? true);
  readonly personalizedTips = signal(this.user()?.notifications?.personalizedTips ?? true);

  readonly profileMessage = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly passwordMessage = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly homeMessage = signal<string | null>(null);
  readonly notificationsMessage = signal<string | null>(null);

  readonly savingProfile = signal<boolean>(false);
  readonly savingPassword = signal<boolean>(false);
  readonly savingHome = signal<boolean>(false);

  showCurrentPass = false;
  showNewPass = false;
  showConfirmPass = false;

  saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    this.profileMessage.set(null);
    this.profileError.set(null);

    const { fullName, email, phone } = this.profileForm.getRawValue();
    this.iamStore.updateProfile({
      name: (fullName ?? '').trim(),
      email: (email ?? '').trim(),
      phone: (phone ?? '').trim()
    });
    this.savingProfile.set(false);
    this.profileMessage.set('Información personal actualizada correctamente.');
  }

  updatePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const userId = this.user()?.id;
    if (!userId) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    this.passwordMessage.set(null);
    this.passwordError.set(null);

    if (newPassword !== confirmPassword) {
      this.passwordError.set('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    this.savingPassword.set(true);
    // Verifica la contraseña actual contra db.json antes de actualizarla
    this.iamApi.getUserById(userId).subscribe({
      next: (dbUser) => {
        if (dbUser?.password !== currentPassword) {
          this.savingPassword.set(false);
          this.passwordError.set('La contraseña actual es incorrecta.');
          return;
        }
        this.iamApi.updateUserProfile(userId, { password: newPassword ?? '' }).subscribe({
          next: () => {
            this.savingPassword.set(false);
            this.passwordMessage.set('Contraseña actualizada correctamente.');
            this.passwordForm.reset();
          },
          error: () => {
            this.savingPassword.set(false);
            this.passwordError.set('No se pudo actualizar la contraseña.');
          }
        });
      },
      error: () => {
        this.savingPassword.set(false);
        this.passwordError.set('No se pudo verificar la contraseña actual.');
      }
    });
  }

  saveHome(): void {
    if (this.homeForm.invalid || this.savingHome()) {
      this.homeForm.markAllAsTouched();
      return;
    }
    this.savingHome.set(true);
    this.homeMessage.set(null);

    const { homeType, occupants, location, tariff } = this.homeForm.getRawValue();
    this.iamStore.updateProfile({
      home: {
        homeType: homeType ?? '',
        occupants: Number(occupants) || 1,
        location: (location ?? '').trim(),
        tariff: (tariff ?? '').trim()
      }
    });
    this.savingHome.set(false);
    this.homeMessage.set('Información de tu hogar guardada correctamente.');
  }

  saveNotifications(): void {
    const notifications: UserNotifications = {
      highConsumptionAlerts: this.highConsumptionAlerts(),
      maintenanceReminders: this.maintenanceReminders(),
      personalizedTips: this.personalizedTips()
    };
    this.iamStore.updateProfile({ notifications });
    this.notificationsMessage.set('Preferencias de notificación guardadas.');
  }

  goToPlans(): void {
    this.router.navigate(['/inicio']);
  }
}

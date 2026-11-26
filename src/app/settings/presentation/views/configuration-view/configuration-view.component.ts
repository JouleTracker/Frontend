import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { UserNotifications } from '../../../../iam/domain/model/user.entity';
import {
  createPasswordMatchValidator,
  passwordPolicyValidators
} from '../../../../iam/domain/model/password-policy';

/**
 * User Management Settings view (`/configuracion`).
 *
 * Supports personal profile updates, subscription navigation, home/business preferences,
 * notification settings, US-25 Change Password (`PUT /api/v1/users/{id}/password`),
 * and US-40 Account Deactivation (`PATCH /api/v1/users/{id}/deactivate`) with confirmation modal.
 */
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
  readonly iamStore = inject(IamStore);
  private readonly iamApi = inject(IamApi);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly user = this.iamStore.currentUser;
  readonly currentPlan = this.iamStore.currentPlan;
  readonly isBusiness = this.iamStore.isBusiness;
  readonly isHomeowner = this.iamStore.isHomeowner;

  // Personal information form
  readonly profileForm = this.fb.group({
    fullName: [this.user()?.name ?? '', Validators.required],
    email: [this.user()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.user()?.phone ?? '']
  });

  // US-25 Change Password form
  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', passwordPolicyValidators()],
      confirmPassword: ['', Validators.required]
    },
    { validators: createPasswordMatchValidator('newPassword', 'confirmPassword') }
  );

  // Homeowner profile form
  readonly homeForm = this.fb.group({
    homeType: [this.user()?.home?.homeType ?? 'House'],
    occupants: [this.user()?.home?.occupants ?? 1],
    location: [this.user()?.home?.location ?? ''],
    tariff: [this.user()?.home?.tariff ?? '']
  });

  // Business / SME profile form
  readonly businessForm = this.fb.group({
    businessName: [this.user()?.business?.businessName ?? '', Validators.required],
    taxId: [this.user()?.business?.taxId ?? '', Validators.required],
    businessType: [this.user()?.business?.businessType ?? 'Restaurant', Validators.required],
    commercialTariff: [
      this.user()?.business?.commercialTariff ?? 'BT5B Commercial',
      Validators.required
    ],
    address: [this.user()?.business?.address ?? '', Validators.required]
  });

  // Notification preferences
  readonly highConsumptionAlerts = signal(
    this.user()?.notifications?.highConsumptionAlerts ?? true
  );
  readonly maintenanceReminders = signal(
    this.user()?.notifications?.maintenanceReminders ?? true
  );
  readonly personalizedTips = signal(this.user()?.notifications?.personalizedTips ?? true);

  // Feedback banners and toast state
  readonly profileMessage = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly passwordMessage = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly homeMessage = signal<string | null>(null);
  readonly businessMessage = signal<string | null>(null);
  readonly notificationsMessage = signal<string | null>(null);
  readonly toastNotification = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // Loading states
  readonly savingProfile = signal<boolean>(false);
  readonly savingPassword = signal<boolean>(false);
  readonly savingHome = signal<boolean>(false);
  readonly savingBusiness = signal<boolean>(false);

  // US-40 Account Deactivation modal state
  readonly showDeactivateModal = signal<boolean>(false);
  readonly deactivatingAccount = signal<boolean>(false);
  readonly deactivateError = signal<string | null>(null);

  showCurrentPass = false;
  showNewPass = false;
  showConfirmPass = false;

  get currentPasswordControl() {
    return this.passwordForm.get('currentPassword');
  }

  get newPasswordControl() {
    return this.passwordForm.get('newPassword');
  }

  get confirmPasswordControl() {
    return this.passwordForm.get('confirmPassword');
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showDeactivateModal() && !this.deactivatingAccount()) {
      this.closeDeactivateModal();
    }
  }

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
    this.profileMessage.set(
      this.translateMessage('SETTINGS.PROFILE_SAVED', 'Información personal actualizada correctamente.')
    );
  }

  /**
   * US-25: Updates the authenticated user's password via `PUT /api/v1/users/{id}/password`.
   */
  updatePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const userId = this.user()?.id;
    if (!userId) {
      this.passwordError.set(
        this.translateMessage('SETTINGS.NO_SESSION_ERROR', 'No se encontró una sesión de usuario activa.')
      );
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    this.passwordMessage.set(null);
    this.passwordError.set(null);

    if (newPassword !== confirmPassword) {
      this.passwordError.set(
        this.translateMessage('AUTH.PASSWORD_MISMATCH', 'Las contraseñas no coinciden.')
      );
      return;
    }

    if (currentPassword === newPassword) {
      this.passwordError.set(
        this.translateMessage(
          'SETTINGS.PASSWORD_SAME_ERROR',
          'La nueva contraseña debe ser diferente de la actual.'
        )
      );
      return;
    }

    this.savingPassword.set(true);
    this.iamApi.changePassword(userId, currentPassword!, newPassword!).subscribe({
      next: () => {
        this.savingPassword.set(false);
        const successMsg = this.translateMessage(
          'SETTINGS.PASSWORD_UPDATED_SUCCESS',
          'Tu contraseña ha sido actualizada correctamente.'
        );
        this.passwordMessage.set(successMsg);
        this.showToast('success', successMsg);
        this.passwordForm.reset();
        this.showCurrentPass = false;
        this.showNewPass = false;
        this.showConfirmPass = false;
      },
      error: (err: Error) => {
        this.savingPassword.set(false);
        const errorMsg =
          err.message ||
          this.translateMessage(
            'SETTINGS.PASSWORD_UPDATE_ERROR',
            'No se pudo actualizar la contraseña. Verifica tu contraseña actual.'
          );
        this.passwordError.set(errorMsg);
        this.showToast('error', errorMsg);
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
    this.homeMessage.set(
      this.translateMessage('SETTINGS.HOME_SAVED', 'Información de tu hogar guardada correctamente.')
    );
  }

  saveBusiness(): void {
    if (this.businessForm.invalid || this.savingBusiness()) {
      this.businessForm.markAllAsTouched();
      return;
    }
    this.savingBusiness.set(true);
    this.businessMessage.set(null);

    const { businessName, taxId, businessType, commercialTariff, address } =
      this.businessForm.getRawValue();
    this.iamStore.updateProfile({
      business: {
        businessName: (businessName ?? '').trim(),
        taxId: (taxId ?? '').trim(),
        businessType: (businessType ?? '').trim(),
        commercialTariff: (commercialTariff ?? '').trim(),
        address: (address ?? '').trim()
      }
    });
    this.savingBusiness.set(false);
    this.businessMessage.set(
      this.translateMessage('SETTINGS.BUSINESS_SAVED', 'Información del negocio guardada correctamente.')
    );
  }

  saveNotifications(): void {
    const notifications: UserNotifications = {
      highConsumptionAlerts: this.highConsumptionAlerts(),
      maintenanceReminders: this.maintenanceReminders(),
      personalizedTips: this.personalizedTips()
    };
    this.iamStore.updateProfile({ notifications });
    this.notificationsMessage.set(
      this.translateMessage('SETTINGS.NOTIFICATIONS_SAVED', 'Preferencias de notificación guardadas.')
    );
  }

  /**
   * US-40: Opens the Account Deactivation confirmation modal.
   */
  openDeactivateModal(): void {
    this.deactivateError.set(null);
    this.showDeactivateModal.set(true);
  }

  closeDeactivateModal(): void {
    if (this.deactivatingAccount()) return;
    this.showDeactivateModal.set(false);
    this.deactivateError.set(null);
  }

  /**
   * US-40: Confirms account deactivation via `PATCH /api/v1/users/{id}/deactivate`,
   * clears local authentication state immediately, and redirects to sign-in.
   */
  confirmDeactivateAccount(): void {
    if (this.deactivatingAccount()) return;

    this.deactivatingAccount.set(true);
    this.deactivateError.set(null);

    this.iamStore.deactivateCurrentAccount().subscribe({
      next: () => {
        this.deactivatingAccount.set(false);
        this.showDeactivateModal.set(false);
      },
      error: (err: Error) => {
        this.deactivatingAccount.set(false);
        this.deactivateError.set(
          err.message ||
            this.translateMessage(
              'SETTINGS.DEACTIVATE_ERROR',
              'No se pudo desactivar tu cuenta en este momento. Inténtalo nuevamente.'
            )
        );
      }
    });
  }

  goToPlans(): void {
    this.router.navigate(['/inicio']);
  }

  private translateMessage(key: string, fallback: string): string {
    const translated = this.translate.instant(key);
    return translated && translated !== key ? translated : fallback;
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toastNotification.set({ type, message });
    setTimeout(() => {
      if (this.toastNotification()?.message === message) {
        this.toastNotification.set(null);
      }
    }, 4500);
  }
}

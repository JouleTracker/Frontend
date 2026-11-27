import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeConfigurationApi } from '../../../infrastructure/home-configuration.api';
import { HomeType } from '../../../domain/model/home-configuration.entity';
import { NotificationPreferencesApi } from '../../../infrastructure/notification-preferences.api';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { UserNotifications } from '../../../../iam/domain/model/user.entity';
import { splitFullName } from '../../../../iam/infrastructure/user-mapper.util';
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
  private readonly homeApi = inject(HomeConfigurationApi);
  private readonly notificationsApi = inject(NotificationPreferencesApi);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly user = this.iamStore.currentUser;
  readonly currentPlan = this.iamStore.currentPlan;
  readonly isBusiness = this.iamStore.isBusiness;
  readonly isHomeowner = this.iamStore.isHomeowner;

  private readonly splitInitialName = splitFullName(this.user()?.name ?? '');

  // Personal information form (US-22)
  readonly profileForm = this.fb.group({
    firstName: [
      this.user()?.firstName ?? this.splitInitialName.firstName,
      [Validators.required, Validators.maxLength(100)]
    ],
    lastName: [
      this.user()?.lastName ?? this.splitInitialName.lastName,
      [Validators.required, Validators.maxLength(100)]
    ],
    email: [this.user()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.user()?.phone ?? '', [Validators.maxLength(20)]]
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

  // Homeowner profile form (US-48)
  readonly homeForm = this.fb.nonNullable.group({
    homeType: ['House' as HomeType, Validators.required],
    occupants: [1, [
      Validators.required,
      Validators.min(1),
      Validators.max(2147483647),
      Validators.pattern(/^[0-9]+$/)
    ]],
    location: ['', Validators.maxLength(255)],
    tariff: ['', Validators.maxLength(100)]
  });

  readonly loadingHome = signal(false);
  readonly homeLoaded = signal(false);
  readonly homeError = signal<string | null>(null);

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

  // Notification channels (US-38)
  readonly emailEnabled = signal(false);
  readonly whatsappEnabled = signal(false);
  readonly loadingNotifications = signal(false);
  readonly savingNotifications = signal(false);
  readonly notificationsLoaded = signal(false);
  readonly notificationsError = signal<string | null>(null);

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

    if (!this.user()?.id) {
      this.profileError.set(
        this.translateMessage('SETTINGS.NO_SESSION_ERROR', 'No active user session found.')
      );
      return;
    }

    this.savingProfile.set(true);
    this.profileMessage.set(null);
    this.profileError.set(null);

    const { firstName, lastName, phone } = this.profileForm.getRawValue();
    this.iamStore
      .updatePersonalProfile({
        firstName: (firstName ?? '').trim(),
        lastName: (lastName ?? '').trim(),
        phone: (phone ?? '').trim()
      })
      .subscribe({
        next: (updatedUser) => {
          this.savingProfile.set(false);
          this.profileForm.patchValue({
            firstName: updatedUser.firstName ?? (firstName ?? '').trim(),
            lastName: updatedUser.lastName ?? (lastName ?? '').trim(),
            phone: updatedUser.phone ?? ''
          });
          const successMsg = this.translateMessage(
            'SETTINGS.PROFILE_SAVED',
            'Personal information updated successfully.'
          );
          this.profileMessage.set(successMsg);
          this.showToast('success', successMsg);
        },
        error: (err: Error) => {
          this.savingProfile.set(false);
          const errorMsg =
            err.message ||
            this.translateMessage(
              'SETTINGS.PROFILE_UPDATE_ERROR',
              'Unable to update your personal information. Please try again.'
            );
          this.profileError.set(errorMsg);
          this.showToast('error', errorMsg);
        }
      });
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

  constructor() {
    if (this.isHomeowner() && this.user()?.id) {
      this.loadHome();
    }

    if (this.user()?.id) {
      this.loadNotifications();
    }
  }

  loadHome(): void {
    const user = this.user();
    if (!user || !this.isHomeowner() || this.loadingHome()) return;

    this.loadingHome.set(true);
    this.homeLoaded.set(false);
    this.homeError.set(null);
    this.homeMessage.set(null);
    this.homeForm.disable();

    this.homeApi.getConfiguration().subscribe({
      next: (configuration) => {
        this.loadingHome.set(false);

        if (configuration.userId !== this.user()?.id) {
          this.homeError.set(
            this.translateMessage(
              'SETTINGS.HOME_LOAD_ERROR',
              'No se pudo cargar la configuración del hogar.'
            )
          );
          return;
        }

        const legacy = user.home;

        const validTypes: HomeType[] = [
          'House', 'Apartment', 'Office/Premises'
        ];

        const legacyType = legacy?.homeType as HomeType;

        this.homeForm.reset({
          homeType: configuration.configured
            ? configuration.homeType
            : validTypes.includes(legacyType)
              ? legacyType
              : configuration.homeType,
          occupants: configuration.configured
            ? configuration.occupants
            : legacy?.occupants ?? configuration.occupants,
          location: configuration.configured
            ? configuration.location
            : legacy?.location ?? configuration.location,
          tariff: configuration.configured
            ? configuration.tariff
            : legacy?.tariff ?? configuration.tariff
        });

        this.homeLoaded.set(true);
        this.homeForm.enable();
      },
      error: () => {
        this.loadingHome.set(false);
        this.homeError.set(
          this.translateMessage(
            'SETTINGS.HOME_LOAD_ERROR',
            'No se pudo cargar la configuración del hogar.'
          )
        );
      }
    });
  }

  saveHome(): void {
    if (
      this.homeForm.invalid ||
      this.savingHome() ||
      !this.homeLoaded()
    ) {
      this.homeForm.markAllAsTouched();
      return;
    }

    this.savingHome.set(true);
    this.homeMessage.set(null);
    this.homeError.set(null);

    const values = this.homeForm.getRawValue();
    this.homeForm.disable();

    this.homeApi.updateConfiguration({
      homeType: values.homeType,
      occupants: Number(values.occupants),
      location: values.location.trim(),
      tariff: values.tariff.trim()
    }).subscribe({
      next: (configuration) => {
        this.savingHome.set(false);

        if (configuration.userId !== this.user()?.id) {
          this.homeLoaded.set(false);
          this.homeError.set(
            this.translateMessage(
              'SETTINGS.HOME_SAVE_ERROR',
              'No se pudo guardar la configuración del hogar.'
            )
          );
          return;
        }

        this.homeForm.reset({
          homeType: configuration.homeType,
          occupants: configuration.occupants,
          location: configuration.location,
          tariff: configuration.tariff
        });

        this.homeForm.enable();

        const message = this.translateMessage(
          'SETTINGS.HOME_SAVED',
          'Información de tu hogar guardada correctamente.'
        );

        this.homeMessage.set(message);
        this.showToast('success', message);
      },
      error: () => {
        this.savingHome.set(false);
        this.homeForm.enable();

        const message = this.translateMessage(
          'SETTINGS.HOME_SAVE_ERROR',
          'No se pudo guardar la configuración del hogar.'
        );

        this.homeError.set(message);
        this.showToast('error', message);
      }
    });
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

  loadNotifications(): void {
    if (!this.user()?.id || this.loadingNotifications()) {
      return;
    }

    this.loadingNotifications.set(true);
    this.notificationsLoaded.set(false);
    this.notificationsError.set(null);
    this.notificationsMessage.set(null);

    this.notificationsApi.getPreferences().subscribe({
      next: (preferences) => {
        this.loadingNotifications.set(false);

        if (preferences.userId !== this.user()?.id) {
          this.notificationsError.set(
            this.translateMessage(
              'SETTINGS.NOTIFICATIONS_LOAD_ERROR',
              'No se pudieron cargar tus preferencias.'
            )
          );
          return;
        }

        this.emailEnabled.set(preferences.emailEnabled);
        this.whatsappEnabled.set(preferences.whatsappEnabled);
        this.notificationsLoaded.set(true);
      },
      error: () => {
        this.loadingNotifications.set(false);
        this.notificationsError.set(
          this.translateMessage(
            'SETTINGS.NOTIFICATIONS_LOAD_ERROR',
            'No se pudieron cargar tus preferencias.'
          )
        );
      }
    });
  }

  saveNotifications(): void {
    if (
      this.savingNotifications() ||
      !this.notificationsLoaded() ||
      !this.user()?.id
    ) {
      return;
    }

    this.savingNotifications.set(true);
    this.notificationsMessage.set(null);
    this.notificationsError.set(null);

    const notifications: UserNotifications = {
      highConsumptionAlerts: this.highConsumptionAlerts(),
      maintenanceReminders: this.maintenanceReminders(),
      personalizedTips: this.personalizedTips()
    };

    this.notificationsApi.updatePreferences({
      emailEnabled: this.emailEnabled(),
      whatsappEnabled: this.whatsappEnabled()
    }).subscribe({
      next: (preferences) => {
        this.savingNotifications.set(false);

        if (preferences.userId !== this.user()?.id) {
          this.notificationsLoaded.set(false);
          this.notificationsError.set(
            this.translateMessage(
              'SETTINGS.NOTIFICATIONS_SAVE_ERROR',
              'No se pudieron guardar tus preferencias.'
            )
          );
          return;
        }

        this.emailEnabled.set(preferences.emailEnabled);
        this.whatsappEnabled.set(preferences.whatsappEnabled);

        // Preserve existing notification category preferences.
        this.iamStore.updateProfile({ notifications });

        const message = this.translateMessage(
          'SETTINGS.NOTIFICATIONS_SAVED',
          'Preferencias de notificación guardadas.'
        );

        this.notificationsMessage.set(message);
        this.showToast('success', message);
      },
      error: () => {
        this.savingNotifications.set(false);

        const message = this.translateMessage(
          'SETTINGS.NOTIFICATIONS_SAVE_ERROR',
          'No se pudieron guardar tus preferencias.'
        );

        this.notificationsError.set(message);
        this.showToast('error', message);
      }
    });
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

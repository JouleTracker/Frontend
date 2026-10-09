import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Sidebar } from '../../../../shared/presentation/components/sidebar/sidebar';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-configuration-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSlideToggleModule,
    Sidebar
  ],
  templateUrl: './configuration-view.component.html',
  styleUrl: './configuration-view.component.css'
})
export class ConfigurationViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly iamStore = inject(IamStore);

  readonly user = this.iamStore.currentUser;

  // Formulario Información Personal
  profileForm = this.fb.group({
    fullName: [this.user()?.name || 'Alex Rivera', Validators.required],
    email: [this.user()?.email || 'alex.rivera@gmail.com', [Validators.required, Validators.email]],
    phone: ['+51 987 654 321']
  });

  // Formulario Cambiar Contraseña
  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  // Formulario Mi Hogar
  homeForm = this.fb.group({
    homeType: ['Casa'],
    occupants: [4],
    location: ['Lima, Perú'],
    tariff: ['BT5B Residencial']
  });

  // Formulario Preferencias de Consumo
  preferencesForm = this.fb.group({
    energyUnit: ['kWh'],
    currency: ['Soles(S/)'],
    dateFormat: ['dd/mm/aaaa'],
    timeFormat: ['24 horas']
  });

  // Notificaciones toggles
  highConsumptionAlerts = true;
  maintenanceReminders = true;
  personalizedTips = true;

  showCurrentPass = false;
  showNewPass = false;
  showConfirmPass = false;

  saveProfile(): void {
    if (this.profileForm.valid) {
      console.log('Guardando datos personales:', this.profileForm.value);
    }
  }

  updatePassword(): void {
    if (this.passwordForm.valid) {
      console.log('Actualizando contraseña:', this.passwordForm.value);
    }
  }
}

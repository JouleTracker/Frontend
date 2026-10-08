import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SensorsStore } from '../../../application/sensors.store';
import { SensorsApi } from '../../../infrastructure/sensors-api';
import { DevicesStore } from '../../../../devices/application/devices.store';
import { Sensor } from '../../../domain/model/sensor.entity';
import { ApplianceProfile } from '../../../domain/model/appliance-profile.entity';
import { SensorResource } from '../../../infrastructure/sensors-response';

@Component({
  selector: 'app-sensor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './sensor-form.component.html',
  styleUrls: ['./sensor-form.component.css'],
})
export class SensorFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(SensorsStore);
  private readonly api = inject(SensorsApi);
  readonly devicesStore = inject(DevicesStore);

  isEditMode = false;
  sensorId = 0;

  readonly sensor = signal<Sensor | null>(null);
  readonly loading = signal<boolean>(true);
  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly availableModels: string[] = [
    'Shelly Plug S',
    'Sonoff POW R3',
    'Sonoff S26R2',
    'Shelly EM 50A',
    'Tuya Smart Plug',
    'Medidor Riel DIN Zigbee',
    'Genérico ESP32',
  ];

  readonly form = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    model: new FormControl<string>('Shelly Plug S', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<'En línea' | 'Desconectado'>('En línea', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    assignedDeviceId: new FormControl<number | null>(null),
    applianceProfileId: new FormControl<number | null>(null),
  });

  /** Perfil seleccionado actualmente */
  readonly selectedProfile = computed<ApplianceProfile | undefined>(() => {
    const profId = this.form.controls.applianceProfileId.value;
    if (!profId) return undefined;
    return this.store.profiles().find((p) => p.id === Number(profId));
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    // Sensores nuevos
    if (!idParam || idParam === 'nuevo') {
      this.isEditMode = false;
      this.loading.set(false);
      return;
    }

    this.isEditMode = true;
    this.sensorId = Number(idParam);

    if (isNaN(this.sensorId)) {
      this.errorMessage.set('Identificador de sensor no válido');
      this.loading.set(false);
      return;
    }

    const existing = this.store.getSensorById(this.sensorId);
    if (existing) {
      this.populateForm(existing);
      this.loading.set(false);
    } else {
      this.api.getSensorById(this.sensorId).subscribe({
        next: (s) => {
          this.populateForm(s);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set('No se encontró el sensor especificado: ' + err.message);
          this.loading.set(false);
        },
      });
    }
  }

  private populateForm(s: Sensor): void {
    this.sensor.set(s);
    this.form.patchValue({
      name: s.name,
      model: s.model,
      status: s.status,
      assignedDeviceId: s.assignedDeviceId,
      applianceProfileId: s.applianceProfileId,
    });
  }

  /**
   * Cuando se selecciona un dispositivo del inventario, sugiere automáticamente
   * un perfil de electrodoméstico acorde al nombre o categoría del dispositivo.
   */
  onDeviceChange(): void {
    const devId = this.form.controls.assignedDeviceId.value;
    if (!devId) {
      this.form.patchValue({ applianceProfileId: null });
      return;
    }

    const dev = this.devicesStore.devices().find((d) => d.id === Number(devId));
    if (!dev) return;

    // Buscar coincidencia en perfiles
    const profiles = this.store.profiles();
    const devName = dev.name.toLowerCase();

    let matched = profiles.find((p) => devName.includes(p.name.toLowerCase()));
    if (!matched) {
      if (devName.includes('tv') || devName.includes('tele')) {
        matched = profiles.find((p) => p.name === 'Televisor');
      } else if (devName.includes('refri')) {
        matched = profiles.find((p) => p.name === 'Refrigeradora');
      } else if (devName.includes('lava')) {
        matched = profiles.find((p) => p.name === 'Lavadora');
      } else if (devName.includes('aire') || devName.includes('clima')) {
        matched = profiles.find((p) => p.name === 'Aire acondicionado');
      } else if (
        devName.includes('compu') ||
        devName.includes('laptop') ||
        devName.includes('pc')
      ) {
        matched = profiles.find((p) => p.name.includes('Computadora'));
      }
    }

    if (matched) {
      this.form.patchValue({ applianceProfileId: matched.id });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const devId = this.form.value.assignedDeviceId
      ? Number(this.form.value.assignedDeviceId)
      : null;
    const assignedDev = devId ? this.devicesStore.devices().find((d) => d.id === devId) : null;

    const profileId = this.form.value.applianceProfileId
      ? Number(this.form.value.applianceProfileId)
      : null;
    const profile = profileId ? this.store.profiles().find((p) => p.id === profileId) : null;

    // Mantiene el serial existente o genera uno interno transparente para el usuario
    const serial = this.sensor()?.serialNumber || `SN-IOT-${Math.floor(100 + Math.random() * 900)}`;

    const payload: Partial<SensorResource> = {
      name: this.form.value.name!.trim(),
      model: this.form.value.model!,
      serialNumber: serial,
      status: this.form.value.status!,
      assignedDeviceId: devId,
      assignedDeviceName: assignedDev ? assignedDev.name : null,
      assignedDeviceCategory: assignedDev ? assignedDev.category : null,
      applianceProfileId: profile ? profile.id : null,
      applianceProfileName: profile ? profile.name : null,
      recommendedDailyKwh: profile ? profile.recommendedDailyKwh : null,
    };

    if (this.isEditMode) {
      this.store.updateSensor(this.sensorId, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/sensores']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set('Error al actualizar el sensor: ' + err.message);
        },
      });
    } else {
      payload.currentPowerKw = 0;
      payload.todayKwh = 0;
      payload.todayCostSoles = 0;
      payload.lastSync = 'Recién registrado';

      this.store.createSensor(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/sensores']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set('Error al registrar el sensor: ' + err.message);
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/sensores']);
  }
}

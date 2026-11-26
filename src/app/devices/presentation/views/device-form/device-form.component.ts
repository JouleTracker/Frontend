import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DevicesStore } from '../../../application/devices.store';
import { DevicesApi } from '../../../infrastructure/devices-api';
import { Device, DeviceStatus } from '../../../domain/model/device.entity';
import { SensorsStore } from '../../../../iot/application/sensors.store';
import { Sensor } from '../../../../iot/domain/model/sensor.entity';
import { DeviceResource } from '../../../infrastructure/devices-response';
import { AreasStore } from '../../../../business/application/areas.store';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/**
 * Component for creating and editing device information.
 * Routes: /dispositivos/nuevo (crear) and /dispositivos/:id (editar)
 */
@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './device-form.component.html',
  styleUrls: ['./device-form.component.css']
})
export class DeviceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(DevicesStore);
  private readonly api = inject(DevicesApi);
  readonly sensorsStore = inject(SensorsStore);
  readonly areasStore = inject(AreasStore);
  private readonly translate = inject(TranslateService);

  private readonly categoryKeyMap: Record<string, string> = {
    'Hogar': 'DEVICES.CAT_HOME',
    'Cocina': 'DEVICES.CAT_KITCHEN',
    'Climatización': 'DEVICES.CAT_HVAC',
    'Iluminación': 'DEVICES.CAT_LIGHTING',
    'Entretenimiento': 'DEVICES.CAT_ENTERTAINMENT',
    'Oficina': 'DEVICES.CAT_OFFICE',
    'Maquinaria': 'DEVICES.CAT_MACHINERY',
    'Refrigeración': 'DEVICES.CAT_REFRIGERATION',
    'Otros': 'DEVICES.CAT_OTHER',
  };

  getCategoryKey(cat: string): string {
    return this.categoryKeyMap[cat] ?? cat;
  }

  getStatusKey(status: string): string {
    switch (status) {
      case 'En línea':
        return 'DEVICES.STATUS_ONLINE';
      case 'En espera':
        return 'DEVICES.STATUS_STANDBY';
      case 'Apagado':
        return 'DEVICES.STATUS_OFF';
      default:
        return status;
    }
  }

  readonly categories: string[] = [
    'Hogar',
    'Cocina',
    'Climatización',
    'Iluminación',
    'Entretenimiento',
    'Oficina',
    'Maquinaria',
    'Refrigeración',
    'Otros'
  ];

  isEditMode = false;
  deviceId = 0;
  initialSensorId: number | null = null;

  readonly device = signal<Device | null>(null);
  readonly loading = signal<boolean>(true);
  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    location: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    category: new FormControl<string>('Hogar', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    status: new FormControl<DeviceStatus>('Apagado', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    assignedSensorId: new FormControl<number | null>(null)
  });

  /**
   * Sensores disponibles para asignación:
   * Sensores libres (sin asignar) más el sensor actualmente vinculado en modo edición.
   */
  readonly availableSensors = computed<Sensor[]>(() => {
    const list = this.sensorsStore.sensors();
    if (!this.isEditMode) {
      return list.filter(s => !s.isAssigned);
    }
    return list.filter(s => !s.isAssigned || s.assignedDeviceId === this.deviceId);
  });

  /** Sensor seleccionado actualmente en el formulario */
  readonly selectedSensor = computed<Sensor | undefined>(() => {
    const sId = this.form.controls.assignedSensorId.value;
    if (!sId) return undefined;
    return this.sensorsStore.sensors().find(s => s.id === Number(sId));
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam || idParam === 'nuevo') {
      this.isEditMode = false;
      this.loading.set(false);
      return;
    }

    this.isEditMode = true;
    this.deviceId = Number(idParam);

    if (isNaN(this.deviceId)) {
      this.errorMessage.set(this.translate.instant('DEVICES.INVALID_ID'));
      this.loading.set(false);
      return;
    }

    const existing = this.store.getDeviceById(this.deviceId);
    if (existing) {
      this.populateForm(existing);
      this.loading.set(false);
    } else {
      this.api.getDeviceById(this.deviceId).subscribe({
        next: (dev) => {
          this.populateForm(dev);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(this.translate.instant('DEVICES.NOT_FOUND_ERROR', { msg: err.message }));
          this.loading.set(false);
        }
      });
    }
  }

  private populateForm(dev: Device): void {
    this.device.set(dev);

    const linkedSensor = this.sensorsStore.sensors().find(s => s.assignedDeviceId === dev.id);
    this.initialSensorId = linkedSensor?.id ?? null;

    let initialStatus: DeviceStatus = dev.status;
    if ((initialStatus as unknown as string) === 'Encendido') initialStatus = 'En línea';
    if ((initialStatus as unknown as string) === 'Standby') initialStatus = 'En espera';

    this.form.patchValue({
      name: dev.name,
      location: dev.location,
      category: dev.category,
      status: initialStatus,
      assignedSensorId: this.initialSensorId
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && !this.store.canAddDevice()) {
      this.errorMessage.set(
        this.translate.instant('DEVICES.LIMIT_ERROR', { limit: this.store.deviceLimit() })
      );
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const formValues = this.form.getRawValue();
    const sensorId = formValues.assignedSensorId ? Number(formValues.assignedSensorId) : null;
    const selectedSensor = sensorId ? this.sensorsStore.sensors().find(s => s.id === sensorId) : null;

    // Respetar el estado explícitamente seleccionado por el usuario en el formulario
    const chosenStatus: DeviceStatus = formValues.status;

    // Determinar telemetría real: toma los datos del sensor si está vinculado
    let power = selectedSensor ? selectedSensor.currentPowerKw : (this.device()?.currentPowerKw ?? 0);
    const kwh = selectedSensor ? selectedSensor.todayKwh : (this.device()?.todayKwh ?? 0);

    // Si el usuario marca el dispositivo como 'Apagado', la potencia actual es 0 kW
    if (chosenStatus === 'Apagado') {
      power = 0;
    }

    if (this.isEditMode) {
      const changes: Partial<DeviceResource> = {
        name: formValues.name.trim(),
        location: formValues.location.trim(),
        category: formValues.category,
        status: chosenStatus,
        currentPowerKw: power,
        todayKwh: kwh,
        lastActivity: chosenStatus === 'Apagado'
          ? this.translate.instant('DEVICES.LAST_MANUAL_OFF')
          : (selectedSensor ? this.translate.instant('DEVICES.LAST_LIVE_IOT') : (this.device()?.lastActivity ?? this.translate.instant('DEVICES.LAST_UPDATED')))
      };

      this.store.updateDevice(this.deviceId, changes).subscribe({
        next: () => {
          this.syncSensorAssignment(this.deviceId, changes.name!, changes.category!, sensorId);
          this.submitting.set(false);
          this.router.navigate(['/dispositivos']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(this.translate.instant('DEVICES.SAVE_ERROR', { msg: err.message }));
        }
      });
    } else {
      const newDevice: Partial<DeviceResource> = {
        name: formValues.name.trim(),
        location: formValues.location.trim(),
        category: formValues.category,
        status: chosenStatus,
        currentPowerKw: power,
        todayKwh: kwh,
        lastActivity: chosenStatus === 'Apagado'
          ? this.translate.instant('DEVICES.LAST_OFF')
          : (selectedSensor ? this.translate.instant('DEVICES.LAST_LIVE_IOT') : this.translate.instant('DEVICES.LAST_CREATED'))
      };

      this.store.createDevice(newDevice).subscribe({
        next: (createdDev) => {
          if (sensorId) {
            this.syncSensorAssignment(createdDev.id, createdDev.name, createdDev.category, sensorId);
          }
          this.submitting.set(false);
          this.router.navigate(['/dispositivos']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(this.translate.instant('DEVICES.CREATE_ERROR', { msg: err.message }));
        }
      });
    }
  }

  /**
   * Sincroniza la vinculación bidireccional en el sensor seleccionado.
   */
  private syncSensorAssignment(deviceId: number, devName: string, devCat: string, newSensorId: number | null): void {
    // Si cambió el sensor asignado previamente, liberar el anterior
    if (this.initialSensorId && this.initialSensorId !== newSensorId) {
      this.sensorsStore.updateSensor(this.initialSensorId, {
        assignedDeviceId: null,
        assignedDeviceName: null,
        assignedDeviceCategory: null
      }).subscribe();
    }

    // Si se asignó un nuevo sensor, vincularlo
    if (newSensorId) {
      this.sensorsStore.updateSensor(newSensorId, {
        assignedDeviceId: deviceId,
        assignedDeviceName: devName,
        assignedDeviceCategory: devCat
      }).subscribe();
    }
  }

  onCancel(): void {
    this.router.navigate(['/dispositivos']);
  }
}

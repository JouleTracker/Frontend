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

/**
 * Component for creating and editing device information.
 * Routes: /dispositivos/nuevo (crear) and /dispositivos/:id (editar)
 */
@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
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

  readonly categories: string[] = ['Hogar', 'Cocina', 'Entretenimiento', 'Oficina', 'Otros'];

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
      this.errorMessage.set('Identificador de dispositivo no válido');
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
          this.errorMessage.set('No se pudo encontrar el dispositivo especificado: ' + err.message);
          this.loading.set(false);
        }
      });
    }
  }

  private populateForm(dev: Device): void {
    this.device.set(dev);

    // Identificar si tiene un sensor asociado en SensorsStore
    const linkedSensor = this.sensorsStore.sensors().find(s => s.assignedDeviceId === dev.id);
    this.initialSensorId = linkedSensor?.id ?? null;

    this.form.patchValue({
      name: dev.name,
      location: dev.location,
      category: dev.category,
      assignedSensorId: this.initialSensorId
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    // Límite de dispositivos según el plan (Starter 5, Plus 15, Pro ilimitado)
    if (!this.isEditMode && !this.store.canAddDevice()) {
      this.errorMessage.set(
        `Has alcanzado el límite de ${this.store.deviceLimit()} dispositivos de tu plan. Mejora tu plan para agregar más.`
      );
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const formValues = this.form.getRawValue();
    const sensorId = formValues.assignedSensorId ? Number(formValues.assignedSensorId) : null;
    const selectedSensor = sensorId ? this.sensorsStore.sensors().find(s => s.id === sensorId) : null;

    if (this.isEditMode) {
      const changes = {
        name: formValues.name.trim(),
        location: formValues.location.trim(),
        category: formValues.category
      };

      this.store.updateDevice(this.deviceId, changes).subscribe({
        next: () => {
          this.syncSensorAssignment(this.deviceId, changes.name, changes.category, sensorId);
          this.submitting.set(false);
          this.router.navigate(['/dispositivos']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set('Error al guardar cambios: ' + err.message);
        }
      });
    } else {
      const initialStatus: DeviceStatus = selectedSensor
        ? (selectedSensor.status === 'En línea' ? 'En línea' : 'Apagado')
        : 'Apagado';

      const newDevice: Partial<DeviceResource> = {
        name: formValues.name.trim(),
        location: formValues.location.trim(),
        category: formValues.category,
        status: initialStatus,
        currentPowerKw: selectedSensor ? selectedSensor.currentPowerKw : 0,
        todayKwh: selectedSensor ? selectedSensor.todayKwh : 0,
        lastActivity: 'Recién registrado'
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
          this.errorMessage.set('Error al registrar dispositivo: ' + err.message);
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

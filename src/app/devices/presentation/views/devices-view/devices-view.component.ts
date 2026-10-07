import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DevicesStore } from '../../../application/devices.store';
import { SensorsStore } from '../../../../iot/application/sensors.store';
import { Sensor } from '../../../../iot/domain/model/sensor.entity';
import { Device } from '../../../domain/model/device.entity';

/**
 * Devices view component.
 * Displays real-time device monitoring, calculated energy metrics, category filters and actions.
 */
@Component({
  selector: 'app-devices-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './devices-view.component.html',
  styleUrls: ['./devices-view.component.css'],
})
export class DevicesViewComponent {
  private readonly router = inject(Router);
  readonly store = inject(DevicesStore);
  readonly sensorsStore = inject(SensorsStore);

  readonly categories: string[] = ['Todos', 'Hogar', 'Cocina', 'Entretenimiento', 'Oficina', 'Otros'];

  readonly selectedDevice = signal<Device | null>(null);
  readonly showDeleteModal = signal<boolean>(false);
  readonly isProcessing = signal<boolean>(false);

  addDevice(): void {
    this.router.navigate(['/dispositivos/nuevo']);
  }

  getSensorForDevice(deviceId: number): Sensor | undefined {
    return this.sensorsStore.sensors().find(s => s.assignedDeviceId === deviceId);
  }

  openDeleteModal(device: Device): void {
    this.selectedDevice.set(device);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.selectedDevice.set(null);
    this.showDeleteModal.set(false);
    this.isProcessing.set(false);
  }

  confirmDeleteDevice(): void {
    const dev = this.selectedDevice();
    if (!dev) return;

    this.isProcessing.set(true);

    // 1. Si tenía un sensor asignado, desvincularlo para que quede libre
    const linkedSensor = this.getSensorForDevice(dev.id);
    if (linkedSensor) {
      this.sensorsStore.unlinkSensor(linkedSensor.id).subscribe();
    }

    // 2. Eliminar dispositivo
    this.store.deleteDevice(dev.id).subscribe({
      next: () => {
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error eliminando dispositivo:', err);
        this.isProcessing.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.store.setSearchTerm(term);
  }

  selectCategory(category: string): void {
    this.store.selectCategory(category);
  }

  onSortChange(sort: string): void {
    this.store.setSort(sort);
  }

  goToSettings(): void {
    this.router.navigate(['/configuracion']);
  }

  goToRecommendations(): void {
    this.router.navigate(['/recomendaciones']);
  }

  editDevice(id: number): void {
    this.router.navigate(['/dispositivos', id]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'En línea':
        return 'status-online';
      case 'Apagado':
        return 'status-offline';
      case 'En espera':
        return 'status-standby';
      default:
        return '';
    }
  }

  formatPower(powerKw: number): string {
    if (powerKw === 0) return '0.00 kW';
    if (powerKw < 0.05) return `${powerKw.toFixed(3)} kW`;
    return `${powerKw.toFixed(2)} kW`;
  }
}

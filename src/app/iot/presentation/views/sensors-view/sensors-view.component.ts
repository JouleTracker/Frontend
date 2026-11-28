import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SensorsStore } from '../../../application/sensors.store';
import { Sensor } from '../../../domain/model/sensor.entity';
import { IamStore } from '../../../../iam/application/iam.store';
import {
  PlanUpgradeRequiredComponent
} from '../../../../shared/presentation/components/plan-upgrade-required/plan-upgrade-required';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sensors-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, PlanUpgradeRequiredComponent, TranslatePipe],
  templateUrl: './sensors-view.component.html',
  styleUrls: ['./sensors-view.component.css'],
})
export class SensorsViewComponent {
  private readonly router = inject(Router);
  readonly store = inject(SensorsStore);
  private readonly iamStore = inject(IamStore);
  private readonly translate = inject(TranslateService);

  /** Módulo de sensores bloqueado para el plan Starter */
  readonly canAccessSensors = this.iamStore.canAccessSensors;

  /** Límite de sensores del plan actual (Starter 0, Plus 3, Pro ilimitado) */
  readonly sensorLimit = this.store.sensorLimit;
  readonly canAddSensor = this.store.canAddSensor;

  readonly sensorLimitLabel = computed(() => {
    const limit = this.sensorLimit();
    const count = this.store.sensorCount();
    return Number.isFinite(limit)
      ? this.translate.instant('COMMON.LIMITED_COUNT', { count, limit })
      : this.translate.instant('COMMON.UNLIMITED_COUNT', { count });
  });

  readonly filters: string[] = ['Todos', 'Monitoreando', 'Sin asignar', 'En línea'];

  private readonly filterKeyMap: Record<string, string> = {
    'Todos': 'IOT.FILTER_ALL',
    'Monitoreando': 'IOT.FILTER_MONITORING',
    'Sin asignar': 'IOT.FILTER_UNASSIGNED',
    'En línea': 'IOT.FILTER_ONLINE',
  };

  private readonly categoryKeyMap: Record<string, string> = {
    'Hogar': 'DEVICES.CAT_HOME',
    'Maquinaria': 'DEVICES.CAT_MACHINERY',
    'Refrigeración': 'DEVICES.CAT_REFRIGERATION',
    'Climatización': 'DEVICES.CAT_HVAC',
    'Iluminación': 'DEVICES.CAT_LIGHTING',
    'Oficina': 'DEVICES.CAT_OFFICE',
    'Cocina': 'DEVICES.CAT_KITCHEN',
    'Entretenimiento': 'DEVICES.CAT_ENTERTAINMENT',
    'Otros': 'DEVICES.CAT_OTHER',
  };

  getFilterKey(filter: string): string {
    return this.filterKeyMap[filter] ?? filter;
  }

  getCategoryKey(cat: string): string {
    return this.categoryKeyMap[cat] ?? cat;
  }

  getStatusKey(status: string): string {
    return status === 'En línea' ? 'COMMON.ONLINE' : 'COMMON.OFFLINE';
  }

  // Modal de confirmación de desvinculación y eliminación
  readonly selectedSensor = signal<Sensor | null>(null);
  readonly modalMode = signal<'unlink' | 'delete' | null>(null);
  readonly isProcessing = signal<boolean>(false);

  onSearch(term: string): void {
    this.store.setSearchTerm(term);
  }

  selectFilter(filter: string): void {
    this.store.selectFilter(filter);
  }

  onSortChange(sort: string): void {
    this.store.setSort(sort);
  }

  addSensor(): void {
    this.router.navigate(['/sensores/nuevo']);
  }

  editSensor(id: number): void {
    this.router.navigate(['/sensores', id]);
  }

  openUnlinkModal(sensor: Sensor): void {
    this.selectedSensor.set(sensor);
    this.modalMode.set('unlink');
  }

  openDeleteModal(sensor: Sensor): void {
    this.selectedSensor.set(sensor);
    this.modalMode.set('delete');
  }

  closeModal(): void {
    this.selectedSensor.set(null);
    this.modalMode.set(null);
    this.isProcessing.set(false);
  }

  confirmUnlink(): void {
    const s = this.selectedSensor();
    if (!s) return;

    this.isProcessing.set(true);
    this.store.unlinkSensor(s.id).subscribe({
      next: () => {
        this.closeModal();
      },
      error: (err) => {
        console.error('Error desvinculando sensor:', err);
        this.isProcessing.set(false);
      },
    });
  }

  confirmDelete(): void {
    const s = this.selectedSensor();
    if (!s) return;

    this.isProcessing.set(true);
    this.store.deleteSensor(s.id).subscribe({
      next: () => {
        this.closeModal();
      },
      error: (err) => {
        console.error('Error eliminando sensor:', err);
        this.isProcessing.set(false);
      },
    });
  }

  getStatusClass(status: string): string {
    return status === 'En línea' ? 'status-online' : 'status-offline';
  }

  formatPower(powerKw: number): string {
    if (powerKw === 0) return '0.00 kW';
    if (powerKw < 0.05) return `${powerKw.toFixed(3)} kW`;
    return `${powerKw.toFixed(2)} kW`;
  }

  getApplianceIcon(name: string | null): string {
    if (!name) return 'power';
    const lower = name.toLowerCase();
    if (lower.includes('tv') || lower.includes('televisor')) return 'tv';
    if (lower.includes('refrig') || lower.includes('refri')) return 'kitchen';
    if (lower.includes('lava') || lower.includes('lavandería')) return 'local_laundry_service';
    if (lower.includes('consol') || lower.includes('juego')) return 'sports_esports';
    if (lower.includes('aire') || lower.includes('clima')) return 'ac_unit';
    if (lower.includes('compu') || lower.includes('laptop') || lower.includes('pc'))
      return 'computer';
    if (lower.includes('microonda')) return 'microwave';
    return 'devices';
  }
}


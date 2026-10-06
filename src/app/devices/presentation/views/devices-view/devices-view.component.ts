import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device, DeviceSummary } from '../../../domain/model/device.model';
import { DeviceService } from '../../../infrastructure/services/device.service';

/**
 * @description Componente de Presentación para el Bounded Context de Dispositivos.
 * Se encarga de la interacción del usuario, filtrado, ordenamiento y renderizado de la UI.
 */
@Component({
  selector: 'app-devices-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices-view.component.html',
  styleUrls: ['./devices-view.component.css'],
})
export class DevicesViewComponent implements OnInit {
  // --- Propiedades de Estado de la Vista ---
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  summary: DeviceSummary | null = null;

  // --- Filtros y Criterios de Búsqueda ---
  searchTerm: string = '';
  selectedCategory: string = 'Todos';
  selectedSort: string = 'consumo-desc';

  categories: string[] = ['Todos', 'Hogar', 'Cocina', 'Entretenimiento', 'Oficina', 'Otros'];

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.loadDevices();
    this.loadSummary();
  }

  /**
   * Carga la lista principal de dispositivos desde la capa de Infraestructura
   */
  private loadDevices(): void {
    this.deviceService.getDevices().subscribe({
      next: (data) => {
        this.devices = data;
        this.applyFilters();
      },
      error: (err) => console.error('Error al cargar dispositivos:', err),
    });
  }

  /**
   * Carga las métricas resumidas superiores
   */
  private loadSummary(): void {
    this.deviceService.getDeviceSummaries().subscribe({
      next: (summaries) => {
        if (summaries && summaries.length > 0) {
          this.summary = summaries[0];
        }
      },
      error: (err) => console.error('Error al cargar métricas de dispositivos:', err),
    });
  }

  /**
   * Aplica los filtros de búsqueda por texto, categoría y ordenamiento
   */
  applyFilters(): void {
    let result = [...this.devices];

    // 1. Filtrado por término de búsqueda (Nombre o Ubicación)
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(term) || d.location.toLowerCase().includes(term),
      );
    }

    // 2. Filtrado por categoría
    if (this.selectedCategory !== 'Todos') {
      result = result.filter(
        (d) => d.category.toLowerCase() === this.selectedCategory.toLowerCase(),
      );
    }

    // 3. Ordenamiento
    if (this.selectedSort === 'consumo-desc') {
      result.sort((a, b) => b.currentPowerKw - a.currentPowerKw);
    } else if (this.selectedSort === 'consumo-asc') {
      result.sort((a, b) => a.currentPowerKw - b.currentPowerKw);
    } else if (this.selectedSort === 'nombre') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filteredDevices = result;
  }

  /**
   * Cambia la pestaña de categoría seleccionada
   */
  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Retorna las clases CSS dinámicas según el estado del dispositivo
   */
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
}

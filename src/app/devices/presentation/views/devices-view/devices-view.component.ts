import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Device, DeviceSummary } from '../../../domain/model/device.model';
import { DeviceService } from '../../../infrastructure/services/device.service';

/**
 * Devices page.
 * Shows the summary cards and the device table, with search, category tabs and sorting.
 */
@Component({
  selector: 'app-devices-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './devices-view.component.html',
  styleUrls: ['./devices-view.component.css'],
})
export class DevicesViewComponent implements OnInit {
  private router = inject(Router);

  // --- View State ---
  devices: Device[] = []; // Original list from the service (never modified)
  filteredDevices: Device[] = []; // List shown in the table after filters
  summary: DeviceSummary | null = null;

  // --- Filters and Search Criteria ---
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
   * Navigates user to the application settings view.
   */
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Loads the devices and applies the filters so the table is filled on start.
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
   * Loads the data for the top cards (uses the first summary returned).
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
   * Applies the current filters and sorting to the device list.
   */
  applyFilters(): void {
    let result = [...this.devices];

    // 1. Search by name or location
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(term) || d.location.toLowerCase().includes(term),
      );
    }

    // 2. Category ('Todos' skips this filter)
    if (this.selectedCategory !== 'Todos') {
      result = result.filter(
        (d) => d.category.toLowerCase() === this.selectedCategory.toLowerCase(),
      );
    }

    // 3. Sorting
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
   * Changes the active category tab and refreshes the table.
   */
  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Returns the CSS class of the status badge (green, red or yellow dot).
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

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DevicesStore } from '../../../application/devices.store';

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

  readonly categories: string[] = ['Todos', 'Hogar', 'Cocina', 'Entretenimiento', 'Oficina', 'Otros'];

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

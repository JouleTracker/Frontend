import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertsStore } from '../../../application/alerts.store';

/**
 * Component for managing and displaying user alerts and system notifications.
 */
@Component({
  selector: 'app-alerts-view',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './alerts-view.component.html',
  styleUrl: './alerts-view.component.css',
})
export class AlertsViewComponent {
  private router = inject(Router);

  /** Injected store instance to manage state in HTML */
  readonly store = inject(AlertsStore);

  /** Currently selected alert filter category */
  selectedCategory = signal<string>('Todos');

  /** Available filter categories for alerts */
  categories: string[] = [
    'Todos',
    'Consumo alto',
    'Dispositivo desconectado',
    'Consumo inusual',
    'Mantenimiento',
    'Otros',
  ];

  /**
   * Updates the active category filter tab.
   * @param category Selected category name
   */
  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Navigates user to the application settings view.
   */
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
}

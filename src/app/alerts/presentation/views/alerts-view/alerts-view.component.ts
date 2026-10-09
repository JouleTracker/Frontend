import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertsStore } from '../../../application/alerts.store';

/**
 * Component for managing and displaying user alerts and real-time system notifications.
 */
@Component({
  selector: 'app-alerts-view',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './alerts-view.component.html',
  styleUrl: './alerts-view.component.css',
})
export class AlertsViewComponent {
  private readonly router = inject(Router);
  readonly store = inject(AlertsStore);

  goToSettings(): void {
    this.router.navigate(['/configuracion']);
  }

  goToRecommendations(): void {
    this.router.navigate(['/recomendaciones']);
  }

  getPillClass(status: string): string {
    switch (status) {
      case 'Activa':
        return 'pill-red';
      case 'Leída':
        return 'pill-green';
      default:
        return 'pill-gray';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'error':
        return 'error_outline';
      case 'warning':
        return 'warning_amber';
      default:
        return 'info_outline';
    }
  }
}

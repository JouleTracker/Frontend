import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertSeverity, AlertStatus } from '../../../domain/model/alert.entity';
import { AlertsStore } from '../../../application/alerts.store';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-alerts-view',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './alerts-view.component.html',
  styleUrl: './alerts-view.component.css'
})
export class AlertsViewComponent {
  readonly store = inject(AlertsStore);
  private readonly router = inject(Router);

  getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case 'warning':
        return 'warning_amber';
      case 'error':
        return 'error_outline';
      case 'info':
      default:
        return 'info_outline';
    }
  }

  getPillClass(status: AlertStatus): string {
    return status === 'Activa' ? 'pill-active' : 'pill-resolved';
  }

  goToSettings(): void {
    this.router.navigate(['/configuracion']);
  }

  goToRecommendations(): void {
    this.router.navigate(['/recomendaciones']);
  }
}

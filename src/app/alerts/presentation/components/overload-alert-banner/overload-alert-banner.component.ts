import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertsStore } from '../../../application/alerts.store';
import { Alert } from '../../../domain/model/alert.entity';

@Component({
  selector: 'app-overload-alert-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './overload-alert-banner.component.html',
  styleUrl: './overload-alert-banner.component.css'
})
export class OverloadAlertBannerComponent {
  readonly store = inject(AlertsStore);
  private readonly router = inject(Router);

  readonly modalOpen = signal<boolean>(false);
  readonly selectedAlert = signal<Alert | null>(null);
  private readonly shownModalAlertIds = new Set<number>();

  constructor() {
    effect(() => {
      const primary = this.store.primaryOverloadAlert();
      if (primary && primary.severity === 'critical' && !this.shownModalAlertIds.has(primary.id)) {
        this.shownModalAlertIds.add(primary.id);
        this.selectedAlert.set(primary);
        this.modalOpen.set(true);
      }
    });
  }

  openModal(alert: Alert): void {
    this.selectedAlert.set(alert);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  acknowledgeAlert(alert: Alert): void {
    this.store.markAsRead(alert.id);
    this.modalOpen.set(false);
  }

  goToDevices(): void {
    this.modalOpen.set(false);
    this.router.navigate(['/dispositivos']);
  }

  goToAlerts(): void {
    this.modalOpen.set(false);
    this.router.navigate(['/alertas']);
  }
}
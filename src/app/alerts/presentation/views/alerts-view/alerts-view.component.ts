import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertsStore } from '../../../application/alerts.store';
import { Alert } from '../../../domain/model/alert.entity';

@Component({
  selector: 'app-alerts-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './alerts-view.component.html',
  styleUrl: './alerts-view.component.css',
})
export class AlertsViewComponent implements OnInit {
  private readonly router = inject(Router);
  readonly store = inject(AlertsStore);

  readonly categories: string[] = [
    'Todos',
    'Consumo alto',
    'Dispositivo desconectado',
    'Mantenimiento',
  ];

  ngOnInit(): void {
    this.store.loadAll();
  }

  selectCategory(category: string): void {
    this.store.selectCategory(category);
  }

  onSortChange(sort: string): void {
    this.store.setSort(sort);
  }

  refreshAlerts(): void {
    this.store.loadAll();
  }

  markAlertAsRead(alert: Alert): void {
    if (alert.read && alert.status !== 'Activa') return;
    this.store.markAsRead(alert.id);
  }

  goToSettings(): void {
    this.router.navigate(['/configuracion']);
  }

  goToRecommendations(): void {
    this.router.navigate(['/recomendaciones']);
  }

  getTypeClass(category: string): string {
    switch (category) {
      case 'Consumo alto':
        return 'type-high';
      case 'Dispositivo desconectado':
        return 'type-disconnected';
      case 'Mantenimiento':
        return 'type-maintenance';
      default:
        return 'type-default';
    }
  }

  getPillClass(status: string): string {
    switch (status) {
      case 'Activa':
        return 'pill-red';
      case 'Leída':
        return 'pill-green';
      case 'Resuelta':
        return 'pill-gray';
      default:
        return 'pill-gray';
    }
  }
}
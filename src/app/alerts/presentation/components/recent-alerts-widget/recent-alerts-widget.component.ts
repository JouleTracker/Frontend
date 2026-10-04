import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AlertsStore } from '../../../application/alerts.store';

@Component({
  selector: 'app-recent-alerts-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './recent-alerts-widget.component.html',
  styleUrl: './recent-alerts-widget.component.css'
})
export class RecentAlertsWidgetComponent {
  readonly store = inject(AlertsStore);
}

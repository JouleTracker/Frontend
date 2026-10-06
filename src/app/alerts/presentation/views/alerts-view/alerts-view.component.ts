import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertsStore } from '../../../application/alerts.store';

/**
 * Displays the complete alert list and its loading, empty, and error states.
 */
@Component({
  selector: 'app-alerts-view',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './alerts-view.component.html',
  styleUrl: './alerts-view.component.css',
})
export class AlertsViewComponent {
  readonly store = inject(AlertsStore);
}

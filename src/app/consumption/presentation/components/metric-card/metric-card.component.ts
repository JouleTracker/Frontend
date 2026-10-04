import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.css'
})
export class MetricCardComponent {
  @Input() icon: string = 'bolt';
  @Input() iconTheme: 'theme-flash' | 'theme-green' | 'theme-money' | 'theme-savings' | 'theme-devices' = 'theme-flash';
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() unit?: string;
  @Input() diff?: number;
  @Input() subtext: string = '';

  protected readonly Math = Math;
}

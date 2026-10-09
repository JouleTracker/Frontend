import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RecommendationsStore } from '../../../application/recommendations.store';

@Component({
  selector: 'app-recommendations-widget',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './recommendations-widget.html',
  styleUrl: './recommendations-widget.css'
})
export class RecommendationsWidgetComponent {
  readonly store = inject(RecommendationsStore);
}

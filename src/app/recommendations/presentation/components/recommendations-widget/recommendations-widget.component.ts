import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { RecommendationsStore } from '../../../application/recommendations.store';

@Component({
  selector: 'app-recommendations-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './recommendations-widget.component.html',
  styleUrl: './recommendations-widget.component.css'
})
export class RecommendationsWidgetComponent {
  readonly store = inject(RecommendationsStore);
}

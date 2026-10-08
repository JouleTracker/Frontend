import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ConsumptionOverview, Recommendation } from '../../../domain/recommendation';
import { MOCK_CONSUMPTION_OVERVIEW, MOCK_RECOMMENDATIONS } from '../../../infrastructure/recommendations-mock';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [DecimalPipe, MatIcon, RouterLink],
  templateUrl: './recommendations.html',
  styleUrls: ['../../../../shared/presentation/reporting.css', './recommendations.css'],
})
export class Recommendations {
  readonly overview = signal<ConsumptionOverview | null>(MOCK_CONSUMPTION_OVERVIEW);
  readonly recommendations = signal<readonly Recommendation[]>(MOCK_RECOMMENDATIONS);
}

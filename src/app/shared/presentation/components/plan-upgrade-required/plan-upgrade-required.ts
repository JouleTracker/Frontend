import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-plan-upgrade-required',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './plan-upgrade-required.html',
  styleUrl: './plan-upgrade-required.css'
})
export class PlanUpgradeRequiredComponent {
  readonly featureName = input<string>('esta funcionalidad');
  readonly requiredPlan = input<'Plus' | 'Pro'>('Plus');
}

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-plan-upgrade-required',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './plan-upgrade-required.html',
  styleUrl: './plan-upgrade-required.css'
})
export class PlanUpgradeRequiredComponent {
  readonly featureName = input<string>('esta funcionalidad');
  readonly requiredPlan = input<'Plus' | 'Pro'>('Plus');
}

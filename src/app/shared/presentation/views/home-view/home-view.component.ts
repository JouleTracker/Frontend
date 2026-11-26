import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/user.entity';

interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  badge?: string;
  description: string;
  price: number;
  originalPrice: number;
  discountBadge: string;
  highlightText: string;
  features: string[];
}

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.css'
})
export class HomeViewComponent {
  readonly iamStore = inject(IamStore);

  readonly plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'HOME.PLANS.STARTER.DESC',
      price: 19,
      originalPrice: 29,
      discountBadge: 'HOME.PLANS.STARTER.DISCOUNT',
      highlightText: 'HOME.PLANS.STARTER.HIGHLIGHT',
      features: [
        'HOME.PLANS.STARTER.FEAT_1',
        'HOME.PLANS.STARTER.FEAT_2',
        'HOME.PLANS.STARTER.FEAT_3',
        'HOME.PLANS.STARTER.FEAT_4'
      ]
    },
    {
      id: 'plus',
      name: 'Plus',
      badge: 'HOME.PLANS.PLUS.BADGE',
      description: 'HOME.PLANS.PLUS.DESC',
      price: 39,
      originalPrice: 59,
      discountBadge: 'HOME.PLANS.PLUS.DISCOUNT',
      highlightText: 'HOME.PLANS.PLUS.HIGHLIGHT',
      features: [
        'HOME.PLANS.PLUS.FEAT_1',
        'HOME.PLANS.PLUS.FEAT_2',
        'HOME.PLANS.PLUS.FEAT_3',
        'HOME.PLANS.PLUS.FEAT_4'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'HOME.PLANS.PRO.DESC',
      price: 79,
      originalPrice: 119,
      discountBadge: 'HOME.PLANS.PRO.DISCOUNT',
      highlightText: 'HOME.PLANS.PRO.HIGHLIGHT',
      features: [
        'HOME.PLANS.PRO.FEAT_1',
        'HOME.PLANS.PRO.FEAT_2',
        'HOME.PLANS.PRO.FEAT_3',
        'HOME.PLANS.PRO.FEAT_4',
        'HOME.PLANS.PRO.FEAT_5'
      ]
    }
  ];

  isCurrentPlan(planId: SubscriptionPlan): boolean {
    return this.iamStore.currentPlan() === planId;
  }

  onSelectPlan(planId: SubscriptionPlan): void {
    if (this.isCurrentPlan(planId)) return;
    this.iamStore.updatePlan(planId);
  }
}

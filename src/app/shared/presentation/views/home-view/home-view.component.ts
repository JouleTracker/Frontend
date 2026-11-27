import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.css'
})
export class HomeViewComponent implements OnInit {
  readonly iamStore = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly processingPlan = signal<SubscriptionPlan | null>(null);
  readonly verifyingCheckout = signal<boolean>(false);
  readonly checkoutMessage = signal<string | null>(null);
  readonly checkoutError = signal<string | null>(null);

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

  ngOnInit(): void {
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (checkout === 'success' && sessionId) {
      this.confirmCheckoutReturn(sessionId);
    } else if (checkout === 'cancelled') {
      this.checkoutError.set(
        this.translate.instant('HOME.CHECKOUT_CANCELLED') ||
          'Stripe checkout was cancelled. No charges were made.'
      );
      this.clearCheckoutQueryParams();
    }
  }

  isCurrentPlan(planId: SubscriptionPlan): boolean {
    return this.iamStore.currentPlan() === planId;
  }

  onSelectPlan(planId: SubscriptionPlan): void {
    if (this.isCurrentPlan(planId) || this.processingPlan() !== null) return;

    this.checkoutMessage.set(null);
    this.checkoutError.set(null);
    this.processingPlan.set(planId);

    this.iamStore.startPlanCheckout(planId).subscribe({
      next: (session) => {
        this.processingPlan.set(null);
        window.location.assign(session.checkoutUrl);
      },
      error: (err: Error) => {
        this.processingPlan.set(null);
        this.checkoutError.set(
          err.message ||
            this.translate.instant('HOME.CHECKOUT_ERROR') ||
            'Unable to connect to Stripe Checkout right now. Please try again.'
        );
      }
    });
  }

  private confirmCheckoutReturn(sessionId: string): void {
    this.verifyingCheckout.set(true);
    this.checkoutError.set(null);

    this.iamStore.confirmPlanCheckout(sessionId).subscribe({
      next: (sub) => {
        this.verifyingCheckout.set(false);
        const planName = sub.plan.toUpperCase();
        this.checkoutMessage.set(
          this.translate.instant('HOME.CHECKOUT_SUCCESS', { plan: planName }) ||
            `Payment confirmed! Your ${planName} plan is now active.`
        );
        this.clearCheckoutQueryParams();
      },
      error: (err: Error) => {
        this.verifyingCheckout.set(false);
        this.checkoutError.set(
          err.message ||
            this.translate.instant('HOME.CHECKOUT_ERROR') ||
            'Unable to verify payment with Stripe.'
        );
        this.clearCheckoutQueryParams();
      }
    });
  }

  private clearCheckoutQueryParams(): void {
    this.router.navigate(['/inicio'], { replaceUrl: true }).catch(() => {});
  }
}

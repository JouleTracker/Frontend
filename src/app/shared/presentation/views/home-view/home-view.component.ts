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

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.css'
})
export class HomeViewComponent {
  readonly iamStore = inject(IamStore);

  readonly plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Monitoreo básico y organización del hogar.',
      price: 19,
      originalPrice: 29,
      discountBadge: 'Ahorra 34%',
      highlightText: 'Menos de S/ 1 al día',
      features: [
        'Hasta 5 dispositivos',
        'Módulo de sensores bloqueado',
        'Recomendaciones inteligentes bloqueadas',
        'Historial básico (últimos 7 días)'
      ]
    },
    {
      id: 'plus',
      name: 'Plus',
      badge: 'Más elegido',
      description: 'Optimización y análisis para oficinas o negocios.',
      price: 39,
      originalPrice: 59,
      discountBadge: 'Ahorra 34%',
      highlightText: 'Ideal para oficinas y negocios',
      features: [
        'Hasta 15 dispositivos',
        'Hasta 3 sensores IoT',
        'Recomendaciones inteligentes desbloqueadas',
        'Historial ampliado (últimos 30 días)'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Monitoreo avanzado integral con alta demanda.',
      price: 79,
      originalPrice: 119,
      discountBadge: 'Ahorra 34%',
      highlightText: 'Soporte prioritario incluido',
      features: [
        'Dispositivos ilimitados',
        'Sensores IoT ilimitados',
        'Recomendaciones inteligentes desbloqueadas',
        'Historial completo y análisis detallado',
        'Soporte prioritario'
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

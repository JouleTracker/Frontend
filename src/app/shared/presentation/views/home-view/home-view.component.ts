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
      description: 'Para comenzar a conocer y organizar el consumo.',
      price: 19,
      originalPrice: 29,
      discountBadge: 'Ahorra 34%',
      highlightText: 'Menos de S/ 1 al día',
      features: [
        'Monitoreo básico',
        'Gestión de espacios',
        'Visualización de consumo',
        'Historial básico'
      ]
    },
    {
      id: 'plus',
      name: 'Plus',
      badge: 'Más elegido',
      description: 'Para usuarios que buscan un análisis más completo.',
      price: 39,
      originalPrice: 59,
      discountBadge: 'Ahorra 34%',
      highlightText: 'Ideal para oficinas y negocios',
      features: [
        'Todo lo de Starter',
        'Análisis de tendencias',
        'Gestión ampliada de dispositivos',
        'Recomendaciones',
        'Historial ampliado'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Para una experiencia más completa de monitoreo y análisis.',
      price: 79,
      originalPrice: 119,
      discountBadge: 'Ahorra 34%',
      highlightText: 'Soporte prioritario incluido',
      features: [
        'Todo lo de Plus',
        'Mayor capacidad de seguimiento',
        'Análisis más detallado',
        'Gestión avanzada de información',
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

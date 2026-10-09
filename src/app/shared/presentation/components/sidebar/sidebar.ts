import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/user.entity';

export interface NavItem {
  link: string;
  label: string;
  icon: string;
  minPlan?: SubscriptionPlan; // 'starter' (por defecto), 'plus', o 'pro'
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatNavList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatIcon,
    MatIconButton
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private readonly iamStore = inject(IamStore);

  readonly navItems: NavItem[] = [
    { link: '/inicio', label: 'Inicio', icon: 'home' },
    { link: '/consumo', label: 'Consumo', icon: 'bar_chart' },
    { link: '/dispositivos', label: 'Dispositivos', icon: 'devices' },
    { link: '/sensores', label: 'Sensores', icon: 'sensors', minPlan: 'plus' },
    { link: '/alertas', label: 'Alertas', icon: 'notifications_none' },
    { link: '/reportes', label: 'Reportes', icon: 'chat_bubble_outline' },
    { link: '/recomendaciones', label: 'Recomendaciones', icon: 'favorite_border', minPlan: 'plus' },
    { link: '/configuracion', label: 'Configuración', icon: 'settings' }
  ];

  readonly currentPlan = this.iamStore.currentPlan;

  readonly user = computed(() => {
    const currentUser = this.iamStore.currentUser();
    return {
      name: currentUser?.name || 'Usuario',
      email: currentUser?.email || 'sin-correo@jouletracker.com',
      plan: this.currentPlan()
    };
  });

  isLocked(minPlan?: SubscriptionPlan): boolean {
    if (!minPlan) return false;
    const plan = this.currentPlan();
    if (minPlan === 'plus') return plan === 'starter';
    if (minPlan === 'pro') return plan !== 'pro';
    return false;
  }

  onLogout(): void {
    this.iamStore.signOut();
  }
}

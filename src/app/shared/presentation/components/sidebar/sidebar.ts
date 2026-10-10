import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/user.entity';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

export interface NavItem {
  link: string;
  translationKey: string;
  icon: string;
  minPlan?: SubscriptionPlan;
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
    MatIconButton,
    TranslatePipe,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly iamStore = inject(IamStore);
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal<string>(
    localStorage.getItem('joule_lang') || 'es'
  );

  readonly isMobileDrawerOpen = signal<boolean>(false);

  toggleMobileDrawer(): void {
    this.isMobileDrawerOpen.update((open) => !open);
  }

  closeMobileDrawer(): void {
    this.isMobileDrawerOpen.set(false);
  }

  // Lista calculada: Si es admin, solo muestra las 3 herramientas de gestión
  readonly navItems = computed<NavItem[]>(() => {
    if (this.iamStore.isAdmin()) {
      return [
        { link: '/admin/usuarios', translationKey: 'SIDEBAR.ADMIN_USERS', icon: 'manage_accounts' },
        { link: '/admin/alertas', translationKey: 'SIDEBAR.ADMIN_ALERTS', icon: 'notification_add' },
        { link: '/admin/recomendaciones', translationKey: 'SIDEBAR.ADMIN_RECOMMENDATIONS', icon: 'tips_and_updates' }
      ];
    }

    return [
      { link: '/inicio', translationKey: 'SIDEBAR.HOME', icon: 'home' },
      { link: '/consumo', translationKey: 'SIDEBAR.CONSUMPTION', icon: 'bar_chart' },
      { link: '/dispositivos', translationKey: 'SIDEBAR.DEVICES', icon: 'devices' },
      { link: '/sensores', translationKey: 'SIDEBAR.SENSORS', icon: 'sensors', minPlan: 'plus' },
      { link: '/alertas', translationKey: 'SIDEBAR.ALERTS', icon: 'notifications_none' },
      { link: '/reportes', translationKey: 'SIDEBAR.REPORTS', icon: 'chat_bubble_outline' },
      {
        link: '/recomendaciones',
        translationKey: 'SIDEBAR.RECOMMENDATIONS',
        icon: 'favorite_border',
        minPlan: 'plus',
      },
      { link: '/configuracion', translationKey: 'SIDEBAR.SETTINGS', icon: 'settings' },
    ];
  });

  readonly currentPlan = this.iamStore.currentPlan;

  readonly user = computed(() => {
    const currentUser = this.iamStore.currentUser();
    return {
      name: currentUser?.name || 'Usuario',
      email: currentUser?.email || 'sin-correo@jouletracker.com',
      role: currentUser?.role || 'homeowner',
      plan: this.currentPlan(),
    };
  });

  constructor() {
    const saved = this.currentLang();
    this.translate.use(saved);
  }

  switchLang(lang: string): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('joule_lang', lang);
  }

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

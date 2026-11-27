import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
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

const FONT_SCALE_KEY = 'joule_font_scale';
const HIGH_CONTRAST_KEY = 'joule_high_contrast';
const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 1.3;
const FONT_SCALE_STEP = 0.1;

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

  @ViewChild('sidebarAside') private sidebarAsideRef?: ElementRef<HTMLElement>;

  readonly currentLang = signal<string>(
    localStorage.getItem('joule_lang') === 'es' ? 'es' : 'en'
  );

  readonly fontScale = signal<number>(this.loadInitialFontScale());
  readonly highContrast = signal<boolean>(localStorage.getItem(HIGH_CONTRAST_KEY) === 'true');
  readonly fontScalePercent = computed<number>(() => Math.round(this.fontScale() * 100));

  readonly isMobileDrawerOpen = signal<boolean>(false);
  private lastFocusedElement: HTMLElement | null = null;

  toggleMobileDrawer(): void {
    if (this.isMobileDrawerOpen()) {
      this.closeMobileDrawer();
    } else {
      this.openMobileDrawer();
    }
  }

  openMobileDrawer(): void {
    this.lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.isMobileDrawerOpen.set(true);

    requestAnimationFrame(() => {
      const firstFocusable = this.sidebarAsideRef?.nativeElement.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });
  }

  closeMobileDrawer(): void {
    const wasOpen = this.isMobileDrawerOpen();
    this.isMobileDrawerOpen.set(false);

    if (wasOpen && this.lastFocusedElement?.isConnected) {
      const target = this.lastFocusedElement;
      this.lastFocusedElement = null;
      requestAnimationFrame(() => target.focus());
    } else {
      this.lastFocusedElement = null;
    }
  }

  increaseFontSize(): void {
    const next = Math.min(
      MAX_FONT_SCALE,
      Number((this.fontScale() + FONT_SCALE_STEP).toFixed(2))
    );
    this.applyFontScale(next);
  }

  decreaseFontSize(): void {
    const next = Math.max(
      MIN_FONT_SCALE,
      Number((this.fontScale() - FONT_SCALE_STEP).toFixed(2))
    );
    this.applyFontScale(next);
  }

  toggleHighContrast(): void {
    const next = !this.highContrast();
    this.highContrast.set(next);
    localStorage.setItem(HIGH_CONTRAST_KEY, String(next));
    this.applyHighContrastClass(next);
  }

  // Lista calculada según el rol del usuario ('admin', 'business' o 'homeowner')
  readonly navItems = computed<NavItem[]>(() => {
    if (this.iamStore.isAdmin()) {
      return [
        { link: '/admin/usuarios', translationKey: 'SIDEBAR.ADMIN_USERS', icon: 'manage_accounts' },
        { link: '/admin/alertas', translationKey: 'SIDEBAR.ADMIN_ALERTS', icon: 'notification_add' },
        { link: '/admin/recomendaciones', translationKey: 'SIDEBAR.ADMIN_RECOMMENDATIONS', icon: 'tips_and_updates' }
      ];
    }

    if (this.iamStore.isBusiness()) {
      return [
        { link: '/inicio', translationKey: 'SIDEBAR.HOME', icon: 'home' },
        { link: '/consumo', translationKey: 'SIDEBAR.CONSUMPTION', icon: 'bar_chart' },
        { link: '/dispositivos', translationKey: 'SIDEBAR.BUSINESS_DEVICES', icon: 'precision_manufacturing' },
        { link: '/areas', translationKey: 'SIDEBAR.BUSINESS_AREAS', icon: 'domain' },
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
    }

    // Homeowner (Residencial): interfaz limpia sin carga cognitiva de zonas de negocio
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
    const role = currentUser?.role;
    let badge = (this.currentPlan() || 'pro').toUpperCase();
    if (role === 'admin') {
      badge = 'ADMIN';
    } else if (role === 'business') {
      badge = `MYPE · ${badge}`;
    }
    return {
      name: currentUser?.name || this.translate.instant('COMMON.USER'),
      email: currentUser?.email || 'no-email@jouletracker.com',
      role: role || 'homeowner',
      plan: this.currentPlan(),
      badge,
    };
  });

  constructor() {
    const saved = this.currentLang();
    document.documentElement.lang = saved;
    this.translate.use(saved);
    this.applyFontScale(this.fontScale());
    this.applyHighContrastClass(this.highContrast());
  }

  switchLang(lang: string): void {
    this.currentLang.set(lang);
    document.documentElement.lang = lang;
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

  private loadInitialFontScale(): number {
    const raw = Number(localStorage.getItem(FONT_SCALE_KEY));
    if (!raw || Number.isNaN(raw)) return 1;
    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, raw));
  }

  private applyFontScale(scale: number): void {
    this.fontScale.set(scale);
    localStorage.setItem(FONT_SCALE_KEY, String(scale));
    document.documentElement.style.fontSize = `${Math.round(scale * 100)}%`;
  }

  private applyHighContrastClass(enabled: boolean): void {
    document.documentElement.classList.toggle('high-contrast', enabled);
    document.documentElement.setAttribute('data-contrast', enabled ? 'high' : 'normal');
  }
}

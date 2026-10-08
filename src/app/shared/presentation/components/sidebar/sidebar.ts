import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { AuthService } from '../../../../auth/application/auth.service';

export interface NavItem {
  link: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
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
  private readonly authService = inject(AuthService);

  readonly navItems = signal<NavItem[]>([
    { link: '/inicio', label: 'Inicio', icon: 'home' },
    { link: '/consumo', label: 'Consumo', icon: 'bar_chart' },
    { link: '/dispositivos', label: 'Dispositivos', icon: 'devices' },
    { link: '/alertas', label: 'Alertas', icon: 'notifications_none' },
    { link: '/reportes', label: 'Reportes', icon: 'chat_bubble_outline' },
    { link: '/recomendaciones', label: 'Recomendaciones', icon: 'favorite_border' },
    { link: '/configuracion', label: 'Configuración', icon: 'settings' }
  ]);

  readonly user = computed(() => {
    const currentUser = this.authService.currentUser();
    return {
      name: currentUser?.name || 'Usuario',
      email: currentUser?.email || 'sin-correo@jouletracker.com'
    };
  });

  onLogout(): void {
    this.authService.logout();
  }
}

import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

/**
 * Interface representing a navigation link in the sidebar.
 */
export interface NavItem {
  link: string;
  label: string;
  icon: string;
}

/**
 * Fixed left sidebar component for JouleTracker.
 *
 * Provides main application navigation, logo branding, and user account status
 * using Angular Material components and reactive signals.
 */
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
  /**
   * Navigation items for the sidebar.
   */
  readonly navItems = signal<NavItem[]>([
    { link: '/inicio', label: 'Inicio', icon: 'home' },
    { link: '/consumo', label: 'Consumo', icon: 'bar_chart' },
    { link: '/dispositivos', label: 'Dispositivos', icon: 'devices' },
    { link: '/alertas', label: 'Alertas', icon: 'notifications_none' },
    { link: '/reportes', label: 'Reportes', icon: 'chat_bubble_outline' },
    { link: '/recomendaciones', label: 'Recomendaciones', icon: 'favorite_border' },
    { link: '/configuracion', label: 'Configuración', icon: 'settings' }
  ]);

  /**
   * User profile data displayed at the bottom of the sidebar.
   */
  readonly user = signal({
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com'
  });
}

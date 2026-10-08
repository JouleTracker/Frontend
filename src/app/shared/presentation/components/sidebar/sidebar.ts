import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { IamStore } from '../../../../iam/application/iam.store';

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
  private readonly iamStore = inject(IamStore);

  readonly navItems = signal<NavItem[]>([
    { link: '/inicio', label: 'Inicio', icon: 'home' },
    { link: '/consumo', label: 'Consumo', icon: 'bar_chart' },
    { link: '/dispositivos', label: 'Dispositivos', icon: 'devices' },
    { link: '/sensores', label: 'Sensores', icon: 'sensors' },
    { link: '/alertas', label: 'Alertas', icon: 'notifications_none' },
    { link: '/reportes', label: 'Reportes', icon: 'chat_bubble_outline' },
    { link: '/recomendaciones', label: 'Recomendaciones', icon: 'favorite_border' },
    { link: '/configuracion', label: 'Configuración', icon: 'settings' }
  ]);

  readonly user = computed(() => {
    const currentUser = this.iamStore.currentUser();
    return {
      name: currentUser?.name || 'Usuario',
      email: currentUser?.email || 'sin-correo@jouletracker.com'
    };
  });

  onLogout(): void {
    this.iamStore.signOut();
  }
}

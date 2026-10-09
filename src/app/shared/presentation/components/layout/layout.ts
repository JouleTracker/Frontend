import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Sidebar } from '../sidebar/sidebar';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Main shell layout component for JouleTracker.
 * Hosts the fixed left navigation sidebar and the router-outlet
 * container for displaying view content.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly router = inject(Router);
  private readonly iamStore = inject(IamStore);

  // Señal con la URL actual para evaluar cambios de ruta reactivamente
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  // Rutas de autenticación donde el sidebar nunca debe mostrarse
  private readonly authRoutes = [
    '/login',
    '/registro',
    '/register',
    '/recuperar-contrasena',
    '/forgot-password'
  ];

  // Solo se muestra si está autenticado Y no está en una página de autenticación
  readonly showSidebar = computed(() => {
    const url = this.currentUrl();
    const isAuthPage = this.authRoutes.some((route) => url.startsWith(route));
    return this.iamStore.isSignedIn() && !isAuthPage;
  });
}

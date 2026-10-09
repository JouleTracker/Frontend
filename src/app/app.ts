import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Layout } from './shared/presentation/components/layout/layout';

/**
 * Root component of the JouleTracker application.
 *
 * Imports the shared Layout component which renders the fixed left sidebar
 * and the main routed view container.
 */
@Component({
  selector: 'app-root',
  imports: [Layout],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('jouletrackerfront');
  private readonly translate = inject(TranslateService);

  constructor() {
    const saved = localStorage.getItem('joule_lang') || 'es';
    this.translate.use(saved);
  }
}

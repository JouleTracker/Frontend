import { Component, signal } from '@angular/core';
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
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

/**
 * Main shell layout component for JouleTracker.
 *
 * Hosts the fixed left navigation sidebar and the router-outlet
 * container for displaying view content.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {}

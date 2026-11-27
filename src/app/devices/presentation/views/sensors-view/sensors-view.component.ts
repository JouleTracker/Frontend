import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DevicesStore } from '../../../application/devices.store';
import { OverloadAlertBannerComponent } from '../../../../alerts/presentation/components/overload-alert-banner/overload-alert-banner.component';

@Component({
  selector: 'app-sensors-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, OverloadAlertBannerComponent],
  templateUrl: './sensors-view.component.html',
  styleUrl: './sensors-view.component.css'
})
export class SensorsViewComponent {
  readonly store = inject(DevicesStore);
}
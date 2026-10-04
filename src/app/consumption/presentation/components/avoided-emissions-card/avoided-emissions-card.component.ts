import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-avoided-emissions-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './avoided-emissions-card.component.html',
  styleUrl: './avoided-emissions-card.component.css'
})
export class AvoidedEmissionsCardComponent {
  @Input() kg: number = 28.6;
  @Input() equivalence: string = 'Equivale a plantar 1 árbol al mes';
}

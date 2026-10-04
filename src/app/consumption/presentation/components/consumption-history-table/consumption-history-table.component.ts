import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConsumptionHistory } from '../../../domain/model/consumption-history.entity';

@Component({
  selector: 'app-consumption-history-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './consumption-history-table.component.html',
  styleUrl: './consumption-history-table.component.css'
})
export class ConsumptionHistoryTableComponent {
  @Input() items: ConsumptionHistory[] = [];
}

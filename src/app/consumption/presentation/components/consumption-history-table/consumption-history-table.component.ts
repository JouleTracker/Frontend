import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ConsumptionHistory } from '../../../domain/model/consumption-history.entity';

@Component({
  selector: 'app-consumption-history-table',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './consumption-history-table.component.html',
  styleUrl: './consumption-history-table.component.css'
})
export class ConsumptionHistoryTableComponent {
  @Input() items: ConsumptionHistory[] = [];
}

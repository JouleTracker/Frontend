import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RecommendationsStore } from '../../../application/recommendations.store';
import { Sidebar } from '../../../../shared/presentation/components/sidebar/sidebar';

@Component({
  selector: 'app-recommendations-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, Sidebar],
  templateUrl: './recommendations-view.html',
  styleUrl: './recommendations-view.css',
})
export class RecommendationsViewComponent implements OnInit {
  readonly store = inject(RecommendationsStore);

  readonly categories = [
    'Todas',
    'Ahorro en casa',
    'Por dispositivos',
    'Hábitos',
    'Medio ambiente',
  ];

  selectedSort = 'impact';

  ngOnInit(): void {
    this.store.loadAll();
  }

  onSelectCategory(category: string): void {
    const mapped = category === 'Por dispositivos' ? 'Dispositivos' : category;
    this.store.setCategory(mapped);
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'impact' | 'name';
    this.store.setSort(val);
  }
}

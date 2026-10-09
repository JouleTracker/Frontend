import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RecommendationsStore } from '../../../application/recommendations.store';
import { IamStore } from '../../../../iam/application/iam.store';
import {
  PlanUpgradeRequiredComponent
} from '../../../../shared/presentation/components/plan-upgrade-required/plan-upgrade-required';

interface CategoryOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-recommendations-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    PlanUpgradeRequiredComponent
  ],
  templateUrl: './recommendations-view.html',
  styleUrl: './recommendations-view.css',
})
export class RecommendationsViewComponent implements OnInit {
  readonly store = inject(RecommendationsStore);
  readonly iamStore = inject(IamStore);

  /** Opciones de categoría derivadas dinámicamente con tipado explícito */
  readonly categories = computed<CategoryOption[]>(() => {
    return this.store.availableCategories().map((cat: string) => ({
      label: cat,
      value: cat
    }));
  });

  selectedSort = 'impact';

  ngOnInit(): void {
    if (this.iamStore.hasPlusAccess()) {
      this.store.loadAll();
    }
  }

  onSelectCategory(value: string): void {
    this.store.setCategory(value);
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      const val = target.value as 'impact' | 'name';
      this.store.setSort(val);
    }
  }
}

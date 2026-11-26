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

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-recommendations-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    PlanUpgradeRequiredComponent,
    TranslatePipe
  ],
  templateUrl: './recommendations-view.html',
  styleUrl: './recommendations-view.css',
})
export class RecommendationsViewComponent implements OnInit {
  readonly store = inject(RecommendationsStore);
  readonly iamStore = inject(IamStore);

  private readonly categoryKeyMap: Record<string, string> = {
    'Todas': 'RECOMMENDATIONS.CAT_ALL',
    'Eficiencia': 'RECOMMENDATIONS.CAT_EFFICIENCY',
    'Hogar': 'DEVICES.CAT_HOME',
    'Maquinaria': 'DEVICES.CAT_MACHINERY',
    'Refrigeración': 'DEVICES.CAT_REFRIGERATION',
    'Climatización': 'DEVICES.CAT_HVAC',
    'Iluminación': 'DEVICES.CAT_LIGHTING',
    'Oficina': 'DEVICES.CAT_OFFICE',
    'Cocina': 'DEVICES.CAT_KITCHEN',
    'Entretenimiento': 'DEVICES.CAT_ENTERTAINMENT',
    'Otros': 'DEVICES.CAT_OTHER',
  };

  getCategoryKey(cat: string): string {
    return this.categoryKeyMap[cat] ?? cat;
  }

  /** Opciones de categoría derivadas dinámicamente con tipado explícito */
  readonly categories = computed<CategoryOption[]>(() => {
    return this.store.availableCategories().map((cat: string) => ({
      label: this.getCategoryKey(cat),
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

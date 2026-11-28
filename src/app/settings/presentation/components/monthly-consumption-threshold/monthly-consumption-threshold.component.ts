import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IamStore } from '../../../../iam/application/iam.store';
import { MonthlyConsumptionThresholdApi } from '../../../infrastructure/monthly-consumption-threshold.api';
import { MonthlyConsumptionStatus } from '../../../domain/model/monthly-consumption-threshold.entity';

@Component({
  selector: 'app-monthly-consumption-threshold',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './monthly-consumption-threshold.component.html',
  styleUrl: './monthly-consumption-threshold.component.css'
})
export class MonthlyConsumptionThresholdComponent implements OnInit {
  private readonly api = inject(MonthlyConsumptionThresholdApi);
  private readonly iamStore = inject(IamStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loaded = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  readonly status = signal<MonthlyConsumptionStatus | null>(null);

  readonly monthlyLimit = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(0.001),
    Validators.max(999999999.999),
    Validators.pattern(/^\d+(\.\d{1,3})?$/)
  ]);

  readonly progress = computed(() =>
    Math.min(
      100,
      Math.max(0, this.status()?.consumptionPercentage ?? 0)
    )
  );

  ngOnInit(): void {
    this.loadThreshold();
  }

  loadThreshold(preserveSuccess = false): void {
    if (this.loading() || this.saving()) return;

    this.loading.set(true);
    this.loaded.set(false);
    this.error.set(null);

    if (!preserveSuccess) {
      this.saved.set(false);
    }

    this.monthlyLimit.disable();

    this.api.getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.loading.set(false);

          if (status.userId !== this.iamStore.currentUserId()) {
            this.error.set('THRESHOLD.LOAD_ERROR');
            return;
          }

          this.status.set(status);
          this.monthlyLimit.reset(status.monthlyLimitKwh);
          this.monthlyLimit.enable();
          this.loaded.set(true);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('THRESHOLD.LOAD_ERROR');
        }
      });
  }

  saveThreshold(): void {
    if (
      !this.loaded() ||
      this.saving() ||
      this.monthlyLimit.invalid
    ) {
      this.monthlyLimit.markAsTouched();
      return;
    }

    const value = this.monthlyLimit.value;

    if (value === null || !Number.isFinite(value)) {
      return;
    }

    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    this.monthlyLimit.disable();

    this.api.updateThreshold({
      monthlyLimitKwh: value
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (threshold) => {
          this.saving.set(false);

          if (
            threshold.userId !== this.iamStore.currentUserId()
          ) {
            this.loaded.set(false);
            this.error.set('THRESHOLD.SAVE_ERROR');
            return;
          }

          this.saved.set(true);
          this.loadThreshold(true);
        },
        error: () => {
          this.saving.set(false);
          this.monthlyLimit.enable();
          this.error.set('THRESHOLD.SAVE_ERROR');
        }
      });
  }
}

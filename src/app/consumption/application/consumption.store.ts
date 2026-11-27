import { Injectable, computed, signal } from '@angular/core';
import { ConsumptionApi } from '../infrastructure/consumption-api';
import { ConsumptionSummary } from '../domain/model/consumption-summary.entity';
import { EnergyReading } from '../domain/model/energy-reading.entity';
import { DeviceDistribution } from '../domain/model/device-distribution.entity';
import { ComparativeConsumption } from '../domain/model/comparative-consumption.entity';
import { ConsumptionHistory } from '../domain/model/consumption-history.entity';
import { MonthlyGoal } from '../domain/model/monthly-goal.entity';

@Injectable({
  providedIn: 'root'
})
export class ConsumptionStore {
  private readonly summarySignal = signal<ConsumptionSummary | null>(null);
  readonly summary = this.summarySignal.asReadonly();

  private readonly selectedPeriodSignal = signal<'dia' | 'semana' | 'mes' | 'ano'>('semana');
  readonly selectedPeriod = this.selectedPeriodSignal.asReadonly();

  private readonly energyReadingSignal = signal<EnergyReading | null>(null);
  readonly energyReading = this.energyReadingSignal.asReadonly();

  private readonly hourlyReadingSignal = signal<EnergyReading | null>(null);
  readonly hourlyReading = this.hourlyReadingSignal.asReadonly();

  private readonly deviceDistributionsSignal = signal<DeviceDistribution[]>([]);
  readonly deviceDistributions = this.deviceDistributionsSignal.asReadonly();

  private readonly comparativeConsumptionsSignal = signal<ComparativeConsumption[]>([]);
  readonly comparativeConsumptions = this.comparativeConsumptionsSignal.asReadonly();

  private readonly consumptionHistoriesSignal = signal<ConsumptionHistory[]>([]);
  readonly consumptionHistories = this.consumptionHistoriesSignal.asReadonly();

  private readonly monthlyGoalSignal = signal<MonthlyGoal | null>(null);
  readonly monthlyGoal = this.monthlyGoalSignal.asReadonly();

  private readonly monthlyGoalLoadingSignal = signal<boolean>(false);
  readonly monthlyGoalLoading = this.monthlyGoalLoadingSignal.asReadonly();

  private readonly monthlyGoalSavingSignal = signal<boolean>(false);
  readonly monthlyGoalSaving = this.monthlyGoalSavingSignal.asReadonly();

  private readonly monthlyGoalErrorSignal = signal<string | null>(null);
  readonly monthlyGoalError = this.monthlyGoalErrorSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly totalConsumption = computed(() => this.summary()?.totalConsumption ?? 82.4);
  readonly periodConsumption = computed(() => this.summary()?.periodConsumption ?? 82.4);
  readonly currentPower = computed(() => this.summary()?.currentPower ?? 1.24);
  readonly estimatedCost = computed(() => this.summary()?.estimatedCost ?? 57.68);
  readonly periodEstimatedCost = computed(() => this.summary()?.periodEstimatedCost ?? 57.68);
  readonly estimatedSavings = computed(() => this.summary()?.estimatedSavings ?? 6.80);
  readonly avoidedEmissionsKg = computed(() => this.summary()?.avoidedEmissionsKg ?? 28.6);
  readonly avoidedEmissionsEquivalence = computed(() => {
    return this.summary()?.avoidedEmissionsEquivalence ?? 'Equivale a plantar 1 árbol al mes';
  });

  readonly formattedEstimatedCost = computed(() => `S/ ${this.estimatedCost().toFixed(2)}`);
  readonly formattedPeriodCost = computed(() => `S/ ${this.periodEstimatedCost().toFixed(2)}`);
  readonly formattedEstimatedSavings = computed(() => `S/ ${this.estimatedSavings().toFixed(2)}`);

  readonly totalDistributedKwh = computed(() => {
    return this.deviceDistributions().reduce((acc, curr) => acc + curr.kwh, 0);
  });

  constructor(private api: ConsumptionApi) {
    this.loadAll();
  }

  loadAll(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getSummary().subscribe({
      next: data => this.summarySignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    this.loadEnergyReadings(this.selectedPeriodSignal());

    this.api.getEnergyReadings('dia').subscribe({
      next: data => this.hourlyReadingSignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    this.api.getDeviceDistribution().subscribe({
      next: data => this.deviceDistributionsSignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    this.api.getComparativeConsumption().subscribe({
      next: data => this.comparativeConsumptionsSignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    this.api.getConsumptionHistory().subscribe({
      next: data => {
        this.consumptionHistoriesSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      }
    });

    this.loadMonthlyGoal();
  }

  loadMonthlyGoal(): void {
    this.monthlyGoalLoadingSignal.set(true);
    this.monthlyGoalErrorSignal.set(null);

    this.api.getCurrentMonthlyGoal().subscribe({
      next: goal => {
        this.monthlyGoalSignal.set(goal);
        this.monthlyGoalLoadingSignal.set(false);
      },
      error: err => {
        this.monthlyGoalErrorSignal.set(err.message);
        this.monthlyGoalLoadingSignal.set(false);
      }
    });
  }

  saveMonthlyGoal(targetKwh: number, year?: number, month?: number, onSuccess?: () => void): void {
    this.monthlyGoalSavingSignal.set(true);
    this.monthlyGoalErrorSignal.set(null);

    const existing = this.monthlyGoalSignal();
    const request$ = existing
      ? this.api.updateMonthlyGoal(existing.id, { targetKwh, year, month })
      : this.api.createMonthlyGoal({ targetKwh, year, month });

    request$.subscribe({
      next: saved => {
        this.monthlyGoalSignal.set(saved);
        this.monthlyGoalSavingSignal.set(false);
        onSuccess?.();
      },
      error: err => {
        this.monthlyGoalErrorSignal.set(err.message);
        this.monthlyGoalSavingSignal.set(false);
      }
    });
  }

  deleteMonthlyGoal(onSuccess?: () => void): void {
    const existing = this.monthlyGoalSignal();
    if (!existing) return;

    this.monthlyGoalSavingSignal.set(true);
    this.monthlyGoalErrorSignal.set(null);

    this.api.deleteMonthlyGoal(existing.id).subscribe({
      next: () => {
        this.monthlyGoalSignal.set(null);
        this.monthlyGoalSavingSignal.set(false);
        onSuccess?.();
      },
      error: err => {
        this.monthlyGoalErrorSignal.set(err.message);
        this.monthlyGoalSavingSignal.set(false);
      }
    });
  }

  setPeriod(period: 'dia' | 'semana' | 'mes' | 'ano'): void {
    this.selectedPeriodSignal.set(period);
    this.loadEnergyReadings(period);
  }

  loadEnergyReadings(period: 'dia' | 'semana' | 'mes' | 'ano'): void {
    this.api.getEnergyReadings(period).subscribe({
      next: data => this.energyReadingSignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });
  }
}
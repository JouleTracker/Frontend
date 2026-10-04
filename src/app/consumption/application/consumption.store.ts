import { Injectable, computed, signal } from '@angular/core';
import { ConsumptionApi } from '../infrastructure/consumption-api';
import { ConsumptionSummary } from '../domain/model/consumption-summary.entity';
import { EnergyReading } from '../domain/model/energy-reading.entity';
import { DeviceDistribution } from '../domain/model/device-distribution.entity';
import { ComparativeConsumption } from '../domain/model/comparative-consumption.entity';
import { ConsumptionHistory } from '../domain/model/consumption-history.entity';

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

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  // === COMPUTED DOMAIN SIGNALS (Calculados con las reglas de negocio) ===

  /** Total de consumo en kWh */
  readonly totalConsumption = computed(() => this.summary()?.totalConsumption ?? 82.4);

  /** Consumo del período en kWh */
  readonly periodConsumption = computed(() => this.summary()?.periodConsumption ?? 82.4);

  /** Potencia en tiempo real en kW */
  readonly currentPower = computed(() => this.summary()?.currentPower ?? 1.24);

  /** Costo total calculado: kWh * S/ 0.70 */
  readonly estimatedCost = computed(() => this.summary()?.estimatedCost ?? 57.68);

  /** Costo del período calculado: kWh * S/ 0.70 */
  readonly periodEstimatedCost = computed(() => this.summary()?.periodEstimatedCost ?? 57.68);

  /** Ahorro económico calculado: kWh_ahorrado * S/ 0.70 */
  readonly estimatedSavings = computed(() => this.summary()?.estimatedSavings ?? 6.80);

  /** Emisiones de CO2 evitadas calculadas: kWh_ahorrado * 0.25 kg CO2/kWh */
  readonly avoidedEmissionsKg = computed(() => this.summary()?.avoidedEmissionsKg ?? 28.6);

  /** Equivalencia ecológica en árboles */
  readonly avoidedEmissionsEquivalence = computed(() => {
    return this.summary()?.avoidedEmissionsEquivalence ?? 'Equivale a plantar 1 árbol al mes';
  });

  /** Strings formateados para la presentación */
  readonly formattedEstimatedCost = computed(() => `S/ ${this.estimatedCost().toFixed(2)}`);
  readonly formattedPeriodCost = computed(() => `S/ ${this.periodEstimatedCost().toFixed(2)}`);
  readonly formattedEstimatedSavings = computed(() => `S/ ${this.estimatedSavings().toFixed(2)}`);

  /** Suma de kWh distribuido por dispositivos */
  readonly totalDistributedKwh = computed(() => {
    return this.deviceDistributions().reduce((acc, curr) => acc + curr.kwh, 0);
  });

  constructor(private api: ConsumptionApi) {
    this.loadAll();
  }

  loadAll(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Cargar resumen de consumo (incluye baseline y ahorros)
    this.api.getSummary().subscribe({
      next: data => this.summarySignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    // Cargar lecturas del período seleccionado (por defecto semana)
    this.loadEnergyReadings(this.selectedPeriodSignal());

    // Cargar lecturas horarias ('dia') para las gráficas durante el día / tiempo real
    this.api.getEnergyReadings('dia').subscribe({
      next: data => this.hourlyReadingSignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    // Cargar desglose de dispositivos
    this.api.getDeviceDistribution().subscribe({
      next: data => this.deviceDistributionsSignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    // Cargar comparativa mensual
    this.api.getComparativeConsumption().subscribe({
      next: data => this.comparativeConsumptionsSignal.set(data),
      error: err => this.errorSignal.set(err.message)
    });

    // Cargar historial de consumo
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

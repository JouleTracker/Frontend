import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ConsumptionApi } from '../infrastructure/consumption-api';
import { ConsumptionSummary } from '../domain/model/consumption-summary.entity';
import { EnergyReading } from '../domain/model/energy-reading.entity';
import { DeviceDistribution } from '../domain/model/device-distribution.entity';
import { ComparativeConsumption } from '../domain/model/comparative-consumption.entity';
import { ConsumptionHistory } from '../domain/model/consumption-history.entity';
import { IamStore } from '../../iam/application/iam.store';
import { DevicesStore } from '../../devices/application/devices.store';
import { SensorsStore } from '../../iot/application/sensors.store';
import { ELECTRICITY_TARIFF_PER_KWH } from '../../shared/domain/model/energy-calculation.constants';

@Injectable({
  providedIn: 'root'
})
export class ConsumptionStore {
  private readonly api = inject(ConsumptionApi);
  private readonly iamStore = inject(IamStore);
  private readonly devicesStore = inject(DevicesStore);
  private readonly sensorsStore = inject(SensorsStore);

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

  // === COMPUTED DOMAIN SIGNALS VINCULADOS A SENSORES Y DISPOSITIVOS ===

  /** Potencia en tiempo real: suma la telemetría viva de los sensores/dispositivos activos */
  readonly currentPower = computed(() => {
    // 1. Si los sensores tienen telemetría en vivo, sumamos sus lecturas
    const activeSensorsPower = this.sensorsStore.sensors()
      .filter(s => s.status === 'En línea')
      .reduce((acc, s) => acc + s.currentPowerKw, 0);

    if (activeSensorsPower > 0) return Number(activeSensorsPower.toFixed(2));

    // 2. Si no, usamos la potencia calculada de los dispositivos
    const devicesPower = this.devicesStore.totalPowerKw();
    if (devicesPower > 0) return devicesPower;

    // 3. Fallback al resumen estático
    return this.summary()?.currentPower ?? 0;
  });

  /** Consumo del período en kWh (suma el consumo acumulado hoy de los dispositivos si no hay summary) */
  readonly periodConsumption = computed(() => {
    const fromSummary = this.summary()?.periodConsumption;
    if (fromSummary !== undefined && fromSummary > 0) return fromSummary;

    const devicesKwh = this.devicesStore.devices().reduce((acc, d) => acc + d.todayKwh, 0);
    return Number(devicesKwh.toFixed(2));
  });

  /** Total de consumo en kWh */
  readonly totalConsumption = computed(() => {
    const fromSummary = this.summary()?.totalConsumption;
    if (fromSummary !== undefined && fromSummary > 0) return fromSummary;
    return this.periodConsumption();
  });

  /** Costo del período calculado: kWh * Tarifa (S/ 0.70) */
  readonly periodEstimatedCost = computed(() => {
    return Number((this.periodConsumption() * ELECTRICITY_TARIFF_PER_KWH).toFixed(2));
  });

  /** Ahorro económico calculado */
  readonly estimatedSavings = computed(() => this.summary()?.estimatedSavings ?? 0);

  /** Emisiones de CO2 evitadas calculadas */
  readonly avoidedEmissionsKg = computed(() => this.summary()?.avoidedEmissionsKg ?? 0);

  /** Strings formateados para la vista */
  readonly formattedPeriodCost = computed(() => `S/ ${this.periodEstimatedCost().toFixed(2)}`);
  readonly formattedEstimatedSavings = computed(() => `S/ ${this.estimatedSavings().toFixed(2)}`);

  /** Distribución de dispositivos en vivo para el gráfico de dona */
  readonly liveDeviceDistributions = computed<DeviceDistribution[]>(() => {
    // Si la API ya trajo una distribución calculada, se usa
    const fromApi = this.deviceDistributions();
    if (fromApi.length > 0) return fromApi;

    // Si no, la construimos al vuelo desde la lista viva de Devices
    const devices = this.devicesStore.devices();
    const totalKwh = devices.reduce((acc, d) => acc + d.todayKwh, 0) || 1;
    const palette = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    return devices.map((d, index) => new DeviceDistribution({
      id: d.id,
      name: d.name,
      kwh: d.todayKwh,
      percentage: Math.round((d.todayKwh / totalKwh) * 100),
      color: palette[index % palette.length]
    }));
  });

  constructor() {
    effect(() => {
      const userId = this.iamStore.currentUserId();
      if (userId) {
        this.loadAll();
      }
    });
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

import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnergyCalculationService } from '../../../shared/domain/model/energy-calculation.constants';

export type SensorNetworkStatus = 'En línea' | 'Desconectado';

export interface SensorProps {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  status: SensorNetworkStatus;
  currentPowerKw: number;
  todayKwh: number;
  assignedDeviceId?: number | null;
  assignedDeviceName?: string | null;
  assignedDeviceCategory?: string | null;
  applianceProfileId?: number | null;
  applianceProfileName?: string | null;
  recommendedDailyKwh?: number | null;
  lastSync: string;
}

/**
 * Domain entity representing an IoT smart metering sensor / smart plug.
 * Captures real-time power telemetry and links to monitored domestic appliances.
 */
export class Sensor implements BaseEntity {
  readonly id: number;
  readonly name: string;
  readonly model: string;
  readonly serialNumber: string;
  readonly status: SensorNetworkStatus;
  readonly currentPowerKw: number;
  readonly todayKwh: number;
  readonly assignedDeviceId: number | null;
  readonly assignedDeviceName: string | null;
  readonly assignedDeviceCategory: string | null;
  readonly applianceProfileId: number | null;
  readonly applianceProfileName: string | null;
  readonly recommendedDailyKwh: number | null;
  readonly lastSync: string;

  constructor(props: SensorProps) {
    this.id = props.id;
    this.name = props.name;
    this.model = props.model;
    this.serialNumber = props.serialNumber;
    this.status = props.status;
    this.currentPowerKw = props.currentPowerKw;
    this.todayKwh = props.todayKwh;
    this.assignedDeviceId = props.assignedDeviceId ?? null;
    this.assignedDeviceName = props.assignedDeviceName ?? null;
    this.assignedDeviceCategory = props.assignedDeviceCategory ?? null;
    this.applianceProfileId = props.applianceProfileId ?? null;
    this.applianceProfileName = props.applianceProfileName ?? null;
    this.recommendedDailyKwh = props.recommendedDailyKwh ?? null;
    this.lastSync = props.lastSync;
  }

  get isAssigned(): boolean {
    return this.assignedDeviceId !== null && this.assignedDeviceId !== undefined;
  }

  get isOverRecommendedLimit(): boolean {
    if (!this.recommendedDailyKwh) return false;
    return this.todayKwh > this.recommendedDailyKwh;
  }

  get todayCostSoles(): number {
    return EnergyCalculationService.calculateCost(this.todayKwh);
  }

  get formattedCurrentPower(): string {
    if (this.currentPowerKw === 0) return '0.00 kW';
    if (this.currentPowerKw < 0.05) return `${this.currentPowerKw.toFixed(3)} kW`;
    return `${this.currentPowerKw.toFixed(2)} kW`;
  }
}

import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnergyCalculationService } from '../../../shared/domain/model/energy-calculation.constants';

export type DeviceStatus = 'En línea' | 'Apagado' | 'En espera';

export interface DeviceProps {
  id: number;
  name: string;
  location: string;
  category: string;
  status: DeviceStatus;
  currentPowerKw: number;
  powerLimitKw?: number;
  maintenanceDueDate?: string;
  todayKwh: number;
  lastActivity: string;
}

/**
 * Domain entity representing an electrical device monitored by JouleTracker.
 */
export class Device implements BaseEntity {
  readonly id: number;
  readonly name: string;
  readonly location: string;
  readonly category: string;
  readonly status: DeviceStatus;
  readonly currentPowerKw: number;
  readonly powerLimitKw?: number;
  readonly maintenanceDueDate?: string;
  readonly todayKwh: number;
  readonly lastActivity: string;

  constructor(props: DeviceProps) {
    this.id = props.id;
    this.name = props.name;
    this.location = props.location;
    this.category = props.category;
    this.status = props.status;
    this.currentPowerKw = props.currentPowerKw;
    this.powerLimitKw = props.powerLimitKw;
    this.maintenanceDueDate = props.maintenanceDueDate;
    this.todayKwh = props.todayKwh;
    this.lastActivity = props.lastActivity;
  }

  /**
   * Costo calculado para el consumo de hoy: kWh * S/ 0.70
   */
  get todayCostSoles(): number {
    return EnergyCalculationService.calculateCost(this.todayKwh);
  }

  /**
   * Formato legible del consumo actual en kW.
   * Si es un consumo residual de standby (menor a 0.05 kW pero mayor a 0),
   * muestra hasta 3 decimales (ej. 0.003 kW, 0.012 kW) para visibilizar el consumo fantasma.
   */
  get formattedCurrentPower(): string {
    if (this.currentPowerKw === 0) return '0.00 kW';
    if (this.currentPowerKw < 0.05) return `${this.currentPowerKw.toFixed(3)} kW`;
    return `${this.currentPowerKw.toFixed(2)} kW`;
  }
}

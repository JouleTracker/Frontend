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
  readonly powerLimitKw: number;
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
    this.powerLimitKw = props.powerLimitKw ?? 0.30;
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
}

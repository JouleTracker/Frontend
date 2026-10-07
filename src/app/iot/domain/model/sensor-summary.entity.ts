import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface SensorSummaryProps {
  id: number;
  totalSensors: number;
  activeSensors: number;
  monitoredDevicesCount: number;
  unassignedSensorsCount: number;
  totalMonitoredPowerKw: number;
  totalEnergyTodayKwh: number;
}

/**
 * Domain entity representing aggregate IoT sensors metrics.
 */
export class SensorSummary implements BaseEntity {
  readonly id: number;
  readonly totalSensors: number;
  readonly activeSensors: number;
  readonly monitoredDevicesCount: number;
  readonly unassignedSensorsCount: number;
  readonly totalMonitoredPowerKw: number;
  readonly totalEnergyTodayKwh: number;

  constructor(props: SensorSummaryProps) {
    this.id = props.id;
    this.totalSensors = props.totalSensors;
    this.activeSensors = props.activeSensors;
    this.monitoredDevicesCount = props.monitoredDevicesCount;
    this.unassignedSensorsCount = props.unassignedSensorsCount;
    this.totalMonitoredPowerKw = props.totalMonitoredPowerKw;
    this.totalEnergyTodayKwh = props.totalEnergyTodayKwh;
  }
}

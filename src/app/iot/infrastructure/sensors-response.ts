import { BaseResource } from '../../shared/infrastructure/base-response';
import { SensorNetworkStatus } from '../domain/model/sensor.entity';

export interface SensorResource extends BaseResource {
  name: string;
  model: string;
  serialNumber: string;
  status: SensorNetworkStatus;
  currentPowerKw: number;
  todayKwh: number;
  todayCostSoles?: number;
  assignedDeviceId: number | null;
  assignedDeviceName?: string | null;
  assignedDeviceCategory?: string | null;
  applianceProfileId?: number | null;
  applianceProfileName?: string | null;
  recommendedDailyKwh?: number | null;
  lastSync: string;
}

export interface ApplianceProfileResource extends BaseResource {
  name: string;
  recommendedDailyKwh: number;
  typicalPowerWatts: string;
  icon: string;
}

export interface SensorSummaryResource extends BaseResource {
  totalSensors: number;
  activeSensors: number;
  monitoredDevicesCount: number;
  unassignedSensorsCount: number;
  totalMonitoredPowerKw: number;
  totalEnergyTodayKwh: number;
}

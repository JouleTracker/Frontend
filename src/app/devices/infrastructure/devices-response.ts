import { BaseResource } from '../../shared/infrastructure/base-response';
import { DeviceStatus } from '../domain/model/device.entity';

export interface DeviceResource extends BaseResource {
  name: string;
  location: string;
  category: string;
  status: DeviceStatus;
  currentPowerKw: number;
  powerLimitKw?: number;
  maintenanceDueDate?: string;
  todayKwh: number;
  todayCostSoles?: number;
  lastActivity: string;
}

export interface DeviceSummaryResource extends BaseResource {
  connectedDevices: number;
  waitingDevices: number;
  totalPowerKw: number;
  powerDiffVsYesterday?: number;
  powerDiffVsYesterdayLabel?: string;
  costDiffVsMonth?: number;
  costDiffVsMonthLabel?: string;
  savedKwhMonthly?: number;
  estimatedCostSoles?: number;
}

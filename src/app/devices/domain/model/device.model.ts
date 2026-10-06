/** Device operational status */
export type DeviceStatus = 'En línea' | 'Apagado' | 'En espera';

/** Monitored device domain entity */
export interface Device {
  id: string;
  name: string;
  location: string;
  category: string;
  status: DeviceStatus;
  currentPowerKw: number;
  todayKwh: number;
  todayCostSoles: number;
  lastActivity: string;
}

/** Aggregated system metrics */
export interface DeviceSummary {
  id: number;
  connectedDevices: number;
  waitingDevices: number;
  totalPowerKw: number;
  powerDiffVsYesterdayLabel: string;
  estimatedCostSoles: number;
  costDiffVsMonthLabel: string;
  co2AvoidedKg: number;
}

import { BaseResource } from '../../shared/infrastructure/base-response';

export interface ConsumptionSummaryResource extends BaseResource {
  totalConsumption: number;
  totalConsumptionDiff: number;
  totalConsumptionDiffLabel: string;
  periodConsumption: number;
  periodConsumptionDiff: number;
  currentPower: number;
  activeDevicesCount: number;
  baselineMonthlyKwh: number;
  savedKwhWeekly: number;
  savedKwhMonthly: number;
  estimatedCostDiff?: number;
}

export interface EnergyReadingResource extends BaseResource {
  period: 'dia' | 'semana' | 'mes' | 'ano';
  labels: string[];
  values: number[];
}

export interface DeviceDistributionResource extends BaseResource {
  name: string;
  percentage: number;
  kwh: number;
  color: string;
}

export interface ComparativeConsumptionResource extends BaseResource {
  month: string;
  currentPeriod: number;
  previousPeriod: number;
}

export interface ConsumptionHistoryResource extends BaseResource {
  date: string;
  consumption: string;
  cost: string;
  status: 'Normal' | 'Alto';
}

export type ConsumptionSummaryResponse = ConsumptionSummaryResource;
export type EnergyReadingResponse = EnergyReadingResource[];
export type DeviceDistributionResponse = DeviceDistributionResource[];
export type ComparativeConsumptionResponse = ComparativeConsumptionResource[];
export type ConsumptionHistoryResponse = ConsumptionHistoryResource[];

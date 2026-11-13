import { BaseResource } from '../../shared/infrastructure/base-response';

export interface ConsumptionSummaryResource extends Partial<BaseResource> {
  userId?: number;
  period?: string;
  totalKwh?: number;
  totalCost?: number;
  averagePowerKw?: number;
  peakPowerKw?: number;
  variationPercentage?: number;
  avoidedEmissionsKg?: number;
  totalConsumption?: number;
  totalConsumptionDiff?: number;
  totalConsumptionDiffLabel?: string;
  periodConsumption?: number;
  periodConsumptionDiff?: number;
  currentPower?: number;
  activeDevicesCount?: number;
  baselineMonthlyKwh?: number;
  savedKwhWeekly?: number;
  savedKwhMonthly?: number;
  estimatedCostDiff?: number;
}

export interface EnergyReadingResource extends Partial<BaseResource> {
  period?: 'dia' | 'semana' | 'mes' | 'ano';
  labels?: string[];
  values?: number[];
  // Backend point-based reading shape
  label?: string;
  timestamp?: string;
  kwh?: number;
  powerKw?: number;
  cost?: number;
  deviceId?: number;
  deviceName?: string;
}

export interface DeviceDistributionResource extends Partial<BaseResource> {
  deviceId?: number;
  deviceName?: string;
  category?: string;
  totalKwh?: number;
  totalCost?: number;
  name?: string;
  percentage?: number;
  kwh?: number;
  color?: string;
}

export interface ComparativeConsumptionResource extends Partial<BaseResource> {
  label?: string;
  currentPeriodKwh?: number;
  previousPeriodKwh?: number;
  currentPeriodCost?: number;
  previousPeriodCost?: number;
  differencePercentage?: number;
  month?: string;
  currentPeriod?: number;
  previousPeriod?: number;
}

export interface ConsumptionHistoryResource extends BaseResource {
  deviceId?: number;
  deviceName?: string;
  category?: string;
  powerKw?: number;
  energyKwh?: number;
  recordedAt?: string;
  date?: string;
  consumption?: string;
  cost: string | number;
  status: 'Normal' | 'Alto' | string;
}

export type ConsumptionSummaryResponse = ConsumptionSummaryResource;
export type EnergyReadingResponse = EnergyReadingResource[];
export type DeviceDistributionResponse = DeviceDistributionResource[];
export type ComparativeConsumptionResponse = ComparativeConsumptionResource[];
export type ConsumptionHistoryResponse = ConsumptionHistoryResource[];

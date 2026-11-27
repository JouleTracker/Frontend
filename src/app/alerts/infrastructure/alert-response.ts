import { BaseResource } from '../../shared/infrastructure/base-response';
import { AlertSeverity, AlertStatus, AlertType } from '../domain/model/alert.entity';

export interface AlertResource extends BaseResource {
  userId?: number;
  sensorId?: number;
  category?: AlertType | string;
  deviceId?: number;
  deviceName?: string;
  location?: string;
  thresholdPowerKw?: number;
  currentPowerKw?: number;
  maintenanceDueDate?: string;
  timestamp?: string;
  timeAgo?: string;
  status?: AlertStatus;
  severity?: AlertSeverity | string;
  title?: string;
  description?: string;
  message?: string;
  actionUrl?: string;
  read?: boolean;
  device?: string;
  powerKw?: number;
}

export interface AlertSummaryResource extends BaseResource {
  userId?: number;
  activeCount: number;
  resolvedCount: number;
  totalCount: number;
  reductionPercentage?: number;
  reductionLabel?: string;
}

export type AlertResponse = AlertResource[];
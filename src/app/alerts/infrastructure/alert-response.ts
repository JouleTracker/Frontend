import { BaseResource } from '../../shared/infrastructure/base-response';
import { AlertSeverity, AlertStatus, AlertType } from '../domain/model/alert.entity';

export interface AlertResource extends BaseResource {
  category: AlertType | string;
  deviceId?: number;
  deviceName?: string;
  location?: string;
  thresholdPowerKw?: number;
  currentPowerKw?: number;
  thresholdKwh?: number;
  maintenanceDueDate?: string;
  timestamp?: string;
  timeAgo?: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  title?: string;
  description?: string;
  actionUrl?: string;
  device?: string;
  powerKw?: number;
}

export interface AlertSummaryResource extends BaseResource {
  activeCount: number;
  resolvedCount: number;
  totalCount: number;
  reductionPercentage: number;
  reductionLabel: string;
}

export type AlertResponse = AlertResource[];

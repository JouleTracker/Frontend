import { BaseResource } from '../../shared/infrastructure/base-response';
import { AlertSeverity } from '../domain/model/alert.entity';

export interface AlertResource extends BaseResource {
  userId?: number;
  sensorId?: number;
  deviceId?: number;
  title: string;
  description?: string;
  message?: string;
  timeAgo?: string;
  timestamp?: string;
  severity: AlertSeverity | 'critical' | string;
  actionUrl?: string;
  read?: boolean;
  status?: string;
}

export type AlertResponse = AlertResource[];

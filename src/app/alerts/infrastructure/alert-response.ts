import { BaseResource } from '../../shared/infrastructure/base-response';
import { AlertSeverity } from '../domain/model/alert.entity';

export interface AlertResource extends BaseResource {
  userId?: number;
  title: string;
  description?: string;
  message?: string;
  timeAgo?: string;
  timestamp?: string;
  severity: AlertSeverity;
  actionUrl?: string;
  read?: boolean;
}

export type AlertResponse = AlertResource[];

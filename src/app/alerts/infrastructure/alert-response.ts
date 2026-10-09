import { BaseResource } from '../../shared/infrastructure/base-response';
import { AlertSeverity } from '../domain/model/alert.entity';

export interface AlertResource extends BaseResource {
  userId?: number;
  title: string;
  description: string;
  timeAgo: string;
  severity: AlertSeverity;
  actionUrl: string;
}

export type AlertResponse = AlertResource[];

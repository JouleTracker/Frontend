import { BaseResource } from '../../shared/infrastructure/base-response';

export interface AlertResource extends BaseResource {
  title: string;
  description: string;
  timeAgo: string;
  severity: 'warning' | 'info' | 'error';
  actionUrl: string;
}

export type AlertResponse = AlertResource[];

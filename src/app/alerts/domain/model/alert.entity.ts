import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type AlertSeverity = 'warning' | 'info' | 'error';
export type AlertStatus = 'Activa' | 'Leída';

export interface AlertProps {
  id: number;
  title: string;
  description: string;
  timeAgo: string;
  severity: AlertSeverity;
  actionUrl: string;
  status?: AlertStatus;
}

/**
 * Domain entity representing an alert notification in JouleTracker.
 */
export class Alert implements BaseEntity {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly timeAgo: string;
  readonly severity: AlertSeverity;
  readonly actionUrl: string;
  readonly status: AlertStatus;

  constructor(props: AlertProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.timeAgo = props.timeAgo;
    this.severity = props.severity;
    this.actionUrl = props.actionUrl;
    this.status = props.status ?? (props.severity === 'info' ? 'Leída' : 'Activa');
  }
}

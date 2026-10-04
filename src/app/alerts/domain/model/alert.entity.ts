import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface AlertProps {
  id: number;
  title: string;
  description: string;
  timeAgo: string;
  severity: 'warning' | 'info' | 'error';
  actionUrl: string;
}

export class Alert implements BaseEntity {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly timeAgo: string;
  readonly severity: 'warning' | 'info' | 'error';
  readonly actionUrl: string;

  constructor(props: AlertProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.timeAgo = props.timeAgo;
    this.severity = props.severity;
    this.actionUrl = props.actionUrl;
  }
}

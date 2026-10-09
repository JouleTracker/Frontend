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
}

/**
 * Domain entity representing an alert notification in JouleTracker.
 * Solo contiene los datos reales entregados por la colección `alerts` de db.json.
 */
export class Alert implements BaseEntity {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly timeAgo: string;
  readonly severity: AlertSeverity;
  readonly actionUrl: string;

  constructor(props: AlertProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.timeAgo = props.timeAgo;
    this.severity = props.severity;
    this.actionUrl = props.actionUrl;
  }

  /**
   * Estado derivado de la severidad (regla de dominio):
   * las alertas de advertencia o error requieren atención ('Activa'),
   * las informativas se consideran leídas.
   */
  get status(): AlertStatus {
    return this.severity === 'info' ? 'Leída' : 'Activa';
  }
}

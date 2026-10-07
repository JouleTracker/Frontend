import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type AlertSeverity = 'warning' | 'info' | 'error';
export type AlertStatus = 'Activa' | 'Leída' | 'Resuelta';
export type AlertType = 'Consumo alto' | 'Dispositivo desconectado' | 'Mantenimiento';

export interface AlertProps {
  id: number;
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

/**
 * Función pura auxiliar para interpretar fechas en formatos ISO (YYYY-MM-DD) o local (DD/MM/YYYY).
 */
function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }
  const peruvianMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (peruvianMatch) {
    return new Date(Number(peruvianMatch[3]), Number(peruvianMatch[2]) - 1, Number(peruvianMatch[1]));
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Domain entity representing an alert notification or event in JouleTracker.
 */
export class Alert implements BaseEntity {
  readonly id: number;
  readonly category: AlertType;
  readonly deviceId?: number;
  readonly deviceName: string;
  readonly location: string;
  readonly thresholdPowerKw?: number;
  readonly thresholdKwh?: number;
  readonly currentPowerKw: number;
  readonly maintenanceDueDate?: string;
  readonly timestamp: string;
  readonly timeAgo: string;
  readonly status: AlertStatus;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly description: string;
  readonly actionUrl: string;

  constructor(props: AlertProps) {
    this.id = props.id;
    // Normalizar tipos: 'Consumo inusual' se unifica en 'Consumo alto'
    const rawCat = props.category;
    this.category = (rawCat === 'Consumo inusual' ? 'Consumo alto' : rawCat) as AlertType || 'Consumo alto';
    this.deviceId = props.deviceId;
    this.deviceName = props.deviceName || props.device || 'Dispositivo';
    this.location = props.location || 'Hogar';
    this.thresholdPowerKw = props.thresholdPowerKw;
    this.thresholdKwh = props.thresholdKwh;
    this.currentPowerKw = props.currentPowerKw ?? props.powerKw ?? 0;
    this.maintenanceDueDate = props.maintenanceDueDate;
    this.timestamp = props.timestamp || props.timeAgo || 'Reciente';
    this.timeAgo = props.timeAgo || props.timestamp || 'Reciente';
    this.status = props.status || (props.severity === 'error' ? 'Activa' : props.severity === 'warning' ? 'Leída' : 'Resuelta');
    this.severity = props.severity || (this.status === 'Activa' ? 'error' : this.status === 'Leída' ? 'warning' : 'info');
    this.title = props.title || `Alerta: ${this.category}`;
    this.description = props.description || '';
    this.actionUrl = props.actionUrl || '/alertas';
  }

  /**
   * Comprueba si la fecha de mantenimiento ya venció respecto a la fecha actual (hoy).
   */
  get isMaintenanceOverdue(): boolean {
    if (!this.maintenanceDueDate) return false;
    const dueDate = parseDateString(this.maintenanceDueDate);
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return today.getTime() > dueDate.getTime();
  }

  /**
   * Calcula los días transcurridos desde que venció la fecha de mantenimiento respecto a hoy.
   */
  get daysOverdue(): number {
    if (!this.maintenanceDueDate) return 0;
    const dueDate = parseDateString(this.maintenanceDueDate);
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Fecha de mantenimiento en formato legible DD/MM/YYYY.
   */
  get formattedMaintenanceDate(): string {
    if (!this.maintenanceDueDate) return 'Pendiente';
    const dueDate = parseDateString(this.maintenanceDueDate);
    return dueDate ? formatDateString(dueDate) : this.maintenanceDueDate;
  }

  /**
   * Generación dinámica y justificada del mensaje según las reglas del dominio:
   * - Consumo alto: {Nombre dispositivo} superó su límite de consumo ({valor})
   * - Dispositivo desconectado: Se detectó {Nombre dispositivo} desconectado
   * - Mantenimiento: Fecha de mantenimiento ({fecha}) vencida [con comparación de días si aplica]
   */
  get dynamicMessage(): string {
    switch (this.category) {
      case 'Consumo alto': {
        if (this.thresholdKwh != null) {
          return `${this.deviceName} superó su límite de consumo (${this.thresholdKwh.toFixed(2)} kWh)`;
        }
        return `${this.deviceName} superó su límite de consumo diario`;
      }
      case 'Dispositivo desconectado': {
        return `Se detectó ${this.deviceName} desconectado`;
      }
      case 'Mantenimiento': {
        const dateStr = this.formattedMaintenanceDate;
        const days = this.daysOverdue;
        if (days > 0) {
          return `Fecha de mantenimiento (${dateStr}) venció hace ${days} días`;
        }
        return `Fecha de mantenimiento (${dateStr}) vencida`;
      }
      default:
        return this.description || `Notificación de ${this.category}`;
    }
  }

  /** Propiedades de retrocompatibilidad */
  get device(): string {
    return this.deviceName;
  }

  get powerKw(): number {
    return this.currentPowerKw;
  }
}

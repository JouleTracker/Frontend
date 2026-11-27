import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type AlertSeverity = 'warning' | 'info' | 'error' | 'critical';
export type AlertStatus = 'Activa' | 'Leída' | 'Resuelta';
export type AlertType = 'Consumo alto' | 'Dispositivo desconectado' | 'Mantenimiento';

export interface AlertProps {
  id: number;
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

function normalizeSeverity(rawSeverity?: string, status?: AlertStatus): AlertSeverity {
  const lower = (rawSeverity || '').toLowerCase();
  if (lower === 'critical') return 'critical';
  if (lower === 'error') return 'error';
  if (lower === 'warning') return 'warning';
  if (lower === 'info') return 'info';
  if (status === 'Activa') return 'error';
  if (status === 'Leída') return 'warning';
  return 'info';
}

export class Alert implements BaseEntity {
  readonly id: number;
  readonly userId?: number;
  readonly sensorId?: number;
  readonly category: AlertType | string;
  readonly deviceId?: number;
  readonly deviceName: string;
  readonly location: string;
  readonly thresholdPowerKw?: number;
  readonly currentPowerKw: number;
  readonly maintenanceDueDate?: string;
  readonly timestamp: string;
  readonly timeAgo: string;
  readonly status: AlertStatus;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly description: string;
  readonly message: string;
  readonly actionUrl: string;
  readonly read: boolean;

  constructor(props: AlertProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.sensorId = props.sensorId;
    const rawCat = props.category;
    this.category = (rawCat === 'Consumo inusual' ? 'Consumo alto' : rawCat) || 'Consumo alto';
    this.deviceId = props.deviceId;
    this.deviceName = props.deviceName || props.device || (this.sensorId ? `Sensor #${this.sensorId}` : 'Dispositivo');
    this.location = props.location || 'Hogar';
    this.thresholdPowerKw = props.thresholdPowerKw;
    this.currentPowerKw = props.currentPowerKw ?? props.powerKw ?? 0;
    this.maintenanceDueDate = props.maintenanceDueDate;
    this.timestamp = props.timestamp || props.timeAgo || 'Reciente';
    this.timeAgo = props.timeAgo || props.timestamp || 'Reciente';

    const resolvedRead = props.read ?? (props.status === 'Leída' || props.status === 'Resuelta');
    this.read = resolvedRead;
    this.status = props.status || (resolvedRead ? 'Leída' : 'Activa');
    this.severity = normalizeSeverity(props.severity, this.status);
    this.title = props.title || `Alerta: ${this.category}`;
    this.description = props.description || props.message || '';
    this.message = props.message || props.description || '';
    this.actionUrl = props.actionUrl || '/alertas';
  }

  get isCritical(): boolean {
    return (this.severity === 'critical' || this.severity === 'error') && this.status === 'Activa' && !this.read;
  }

  get isMaintenanceOverdue(): boolean {
    if (!this.maintenanceDueDate) return false;
    const dueDate = parseDateString(this.maintenanceDueDate);
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return today.getTime() > dueDate.getTime();
  }

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

  get formattedMaintenanceDate(): string {
    if (!this.maintenanceDueDate) return 'Pendiente';
    const dueDate = parseDateString(this.maintenanceDueDate);
    return dueDate ? formatDateString(dueDate) : this.maintenanceDueDate;
  }

  get dynamicMessage(): string {
    if (this.message) {
      return this.message;
    }
    switch (this.category) {
      case 'Consumo alto': {
        const limitStr = this.thresholdPowerKw != null ? `${this.thresholdPowerKw.toFixed(2)} kW` : 'su límite';
        return `${this.deviceName} superó su límite de consumo (${limitStr})`;
      }
      case 'Dispositivo desconectado':
        return `Se detectó ${this.deviceName} desconectado`;
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

  get device(): string {
    return this.deviceName;
  }

  get powerKw(): number {
    return this.currentPowerKw;
  }
}
import { AlertResource } from './alert-response';
import { Alert, AlertSeverity } from '../domain/model/alert.entity';

export class AlertAssembler {
  toEntity(resource: AlertResource): Alert {
    return new Alert({
      id: resource.id,
      title: resource.title,
      description: resource.description || resource.message || 'Sin descripción detallada.',
      timeAgo: resource.timeAgo || this.formatTimeAgo(resource.timestamp),
      severity: (resource.severity as AlertSeverity) || (resource.read ? 'info' : 'warning'),
      actionUrl: resource.actionUrl || '/dispositivos'
    });
  }

  toEntities(resources: AlertResource[]): Alert[] {
    return (resources ?? []).map(r => this.toEntity(r));
  }

  private formatTimeAgo(timestamp?: string): string {
    if (!timestamp) return 'Reciente';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Reciente';

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 60) return `Hace ${Math.max(1, diffMin)} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} d`;
  }
}

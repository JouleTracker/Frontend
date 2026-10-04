import { AlertResource } from './alert-response';
import { Alert } from '../domain/model/alert.entity';

export class AlertAssembler {
  toEntity(resource: AlertResource): Alert {
    return new Alert({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      timeAgo: resource.timeAgo,
      severity: resource.severity,
      actionUrl: resource.actionUrl
    });
  }

  toEntities(resources: AlertResource[]): Alert[] {
    return resources.map(r => this.toEntity(r));
  }
}

import { AlertResource, AlertSummaryResource } from './alert-response';
import { Alert } from '../domain/model/alert.entity';
import { AlertSummary } from '../domain/model/alert-summary.entity';

export class AlertAssembler {
  toEntity(resource: AlertResource): Alert {
    return new Alert({
      id: resource.id,
      userId: resource.userId,
      sensorId: resource.sensorId,
      category: resource.category,
      deviceId: resource.deviceId,
      deviceName: resource.deviceName || resource.device,
      location: resource.location,
      thresholdPowerKw: resource.thresholdPowerKw,
      currentPowerKw: resource.currentPowerKw ?? resource.powerKw,
      maintenanceDueDate: resource.maintenanceDueDate,
      timestamp: resource.timestamp,
      timeAgo: resource.timeAgo,
      status: resource.status,
      severity: resource.severity,
      title: resource.title,
      description: resource.description,
      message: resource.message,
      actionUrl: resource.actionUrl,
      read: resource.read
    });
  }

  toEntities(resources: AlertResource[]): Alert[] {
    return (resources ?? []).map(r => this.toEntity(r));
  }
}

export class AlertSummaryAssembler {
  toEntity(resource: AlertSummaryResource): AlertSummary {
    return new AlertSummary({
      id: resource?.id ?? 1,
      activeCount: resource?.activeCount ?? 0,
      resolvedCount: resource?.resolvedCount ?? 0,
      totalCount: resource?.totalCount ?? 0,
      reductionPercentage: resource?.reductionPercentage ?? 0,
      reductionLabel: resource?.reductionLabel ?? 'vs mes anterior'
    });
  }
}
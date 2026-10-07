import { AlertResource, AlertSummaryResource } from './alert-response';
import { Alert } from '../domain/model/alert.entity';
import { AlertSummary } from '../domain/model/alert-summary.entity';

export class AlertAssembler {
  toEntity(resource: AlertResource): Alert {
    return new Alert({
      id: resource.id,
      category: resource.category,
      deviceId: resource.deviceId,
      deviceName: resource.deviceName || resource.device,
      location: resource.location,
      thresholdPowerKw: resource.thresholdPowerKw,
      thresholdKwh: resource.thresholdKwh,
      currentPowerKw: resource.currentPowerKw ?? resource.powerKw,
      maintenanceDueDate: resource.maintenanceDueDate,
      timestamp: resource.timestamp,
      timeAgo: resource.timeAgo,
      status: resource.status,
      severity: resource.severity,
      title: resource.title,
      description: resource.description,
      actionUrl: resource.actionUrl
    });
  }

  toEntities(resources: AlertResource[]): Alert[] {
    return (resources ?? []).map(r => this.toEntity(r));
  }
}

export class AlertSummaryAssembler {
  toEntity(resource: AlertSummaryResource): AlertSummary {
    return new AlertSummary({
      id: resource.id,
      activeCount: resource.activeCount,
      resolvedCount: resource.resolvedCount,
      totalCount: resource.totalCount,
      reductionPercentage: resource.reductionPercentage,
      reductionLabel: resource.reductionLabel
    });
  }
}

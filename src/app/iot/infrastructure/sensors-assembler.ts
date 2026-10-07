import { SensorResource, ApplianceProfileResource, SensorSummaryResource } from './sensors-response';
import { Sensor } from '../domain/model/sensor.entity';
import { ApplianceProfile } from '../domain/model/appliance-profile.entity';
import { SensorSummary } from '../domain/model/sensor-summary.entity';

export class SensorAssembler {
  toEntity(resource: SensorResource): Sensor {
    return new Sensor({
      id: resource.id,
      name: resource.name,
      model: resource.model,
      serialNumber: resource.serialNumber,
      status: resource.status,
      currentPowerKw: resource.currentPowerKw,
      todayKwh: resource.todayKwh,
      assignedDeviceId: resource.assignedDeviceId,
      assignedDeviceName: resource.assignedDeviceName,
      assignedDeviceCategory: resource.assignedDeviceCategory,
      applianceProfileId: resource.applianceProfileId,
      applianceProfileName: resource.applianceProfileName,
      recommendedDailyKwh: resource.recommendedDailyKwh,
      lastSync: resource.lastSync
    });
  }

  toEntities(resources: SensorResource[]): Sensor[] {
    return (resources ?? []).map(r => this.toEntity(r));
  }
}

export class ApplianceProfileAssembler {
  toEntity(resource: ApplianceProfileResource): ApplianceProfile {
    return new ApplianceProfile({
      id: resource.id,
      name: resource.name,
      recommendedDailyKwh: resource.recommendedDailyKwh,
      typicalPowerWatts: resource.typicalPowerWatts,
      icon: resource.icon
    });
  }

  toEntities(resources: ApplianceProfileResource[]): ApplianceProfile[] {
    return (resources ?? []).map(r => this.toEntity(r));
  }
}

export class SensorSummaryAssembler {
  toEntity(resource: SensorSummaryResource): SensorSummary {
    return new SensorSummary({
      id: resource.id,
      totalSensors: resource.totalSensors,
      activeSensors: resource.activeSensors,
      monitoredDevicesCount: resource.monitoredDevicesCount,
      unassignedSensorsCount: resource.unassignedSensorsCount,
      totalMonitoredPowerKw: resource.totalMonitoredPowerKw,
      totalEnergyTodayKwh: resource.totalEnergyTodayKwh
    });
  }
}

import { DeviceResource, DeviceSummaryResource } from './devices-response';
import { Device } from '../domain/model/device.entity';
import { DeviceSummary } from '../domain/model/device-summary.entity';

export class DeviceAssembler {
  toEntity(resource: DeviceResource): Device {
    return new Device({
      id: resource.id,
      name: resource.name,
      location: resource.location,
      category: resource.category,
      status: resource.status,
      currentPowerKw: resource.currentPowerKw,
      powerLimitKw: resource.powerLimitKw,
      maintenanceDueDate: resource.maintenanceDueDate,
      todayKwh: resource.todayKwh,
      lastActivity: resource.lastActivity
    });
  }

  toEntities(resources: DeviceResource[]): Device[] {
    return (resources ?? []).map(r => this.toEntity(r));
  }
}

export class DeviceSummaryAssembler {
  toEntity(resource: DeviceSummaryResource): DeviceSummary {
    return new DeviceSummary({
      id: resource.id,
      connectedDevices: resource.connectedDevices,
      waitingDevices: resource.waitingDevices,
      totalPowerKw: resource.totalPowerKw,
      powerDiffVsYesterday: resource.powerDiffVsYesterday,
      powerDiffVsYesterdayLabel: resource.powerDiffVsYesterdayLabel,
      costDiffVsMonth: resource.costDiffVsMonth,
      costDiffVsMonthLabel: resource.costDiffVsMonthLabel,
      savedKwhMonthly: resource.savedKwhMonthly,
      estimatedCostSoles: resource.estimatedCostSoles
    });
  }
}

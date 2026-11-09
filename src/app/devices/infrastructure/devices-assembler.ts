import { DeviceResource, DeviceSummaryResource } from './devices-response';
import { Device, DeviceStatus } from '../domain/model/device.entity';
import { DeviceSummary } from '../domain/model/device-summary.entity';

export class DeviceAssembler {
  toEntity(resource: DeviceResource): Device {
    let normalizedStatus: DeviceStatus = 'Apagado';
    const rawStatus = (resource.status as unknown as string) ?? '';
    if (rawStatus === 'En línea' || rawStatus === 'Encendido') {
      normalizedStatus = 'En línea';
    } else if (rawStatus === 'En espera' || rawStatus === 'Standby') {
      normalizedStatus = 'En espera';
    } else if (rawStatus === 'Apagado') {
      normalizedStatus = 'Apagado';
    }

    return new Device({
      id: resource.id,
      name: resource.name,
      location: resource.location,
      category: resource.category,
      status: normalizedStatus,
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
    const raw = resource as unknown as Record<string, unknown>;
    const connected = resource.connectedDevices ?? (raw['activeDevices'] as number) ?? 0;
    const waiting = resource.waitingDevices ?? (raw['standbyDevices'] as number) ?? 0;

    return new DeviceSummary({
      id: resource.id,
      connectedDevices: connected,
      waitingDevices: waiting,
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

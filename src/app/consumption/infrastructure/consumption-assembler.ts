import {
  ConsumptionSummaryResource,
  EnergyReadingResource,
  DeviceDistributionResource,
  ComparativeConsumptionResource,
  ConsumptionHistoryResource
} from './consumption-response';
import { ConsumptionSummary } from '../domain/model/consumption-summary.entity';
import { EnergyReading } from '../domain/model/energy-reading.entity';
import { DeviceDistribution } from '../domain/model/device-distribution.entity';
import { ComparativeConsumption } from '../domain/model/comparative-consumption.entity';
import { ConsumptionHistory } from '../domain/model/consumption-history.entity';

const DISTRIBUTION_PALETTE = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#64748b'
];

export class ConsumptionSummaryAssembler {
  toEntity(resource: ConsumptionSummaryResource): ConsumptionSummary {
    const variation = resource.variationPercentage ?? 0;
    const totalKwh = resource.totalConsumption ?? resource.totalKwh ?? 0;
    const avoidedEmissions = resource.avoidedEmissionsKg ?? 0;
    const savedMonthly =
      resource.savedKwhMonthly ??
      (avoidedEmissions > 0 ? Number((avoidedEmissions / 0.25).toFixed(2)) : 0);
    const savedWeekly =
      resource.savedKwhWeekly ??
      (savedMonthly > 0 ? Number((savedMonthly / 4).toFixed(2)) : 0);

    return new ConsumptionSummary({
      id: resource.id ?? resource.userId ?? 0,
      totalConsumption: totalKwh,
      totalConsumptionDiff: resource.totalConsumptionDiff ?? variation,
      totalConsumptionDiffLabel:
        resource.totalConsumptionDiffLabel ??
        `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}% vs. período anterior`,
      periodConsumption: resource.periodConsumption ?? totalKwh,
      periodConsumptionDiff: resource.periodConsumptionDiff ?? variation,
      currentPower: resource.currentPower ?? resource.averagePowerKw ?? 0,
      activeDevicesCount: resource.activeDevicesCount ?? 0,
      baselineMonthlyKwh: resource.baselineMonthlyKwh ?? 0,
      savedKwhWeekly: savedWeekly,
      savedKwhMonthly: savedMonthly
    });
  }
}

export class EnergyReadingAssembler {
  toEntity(resource: EnergyReadingResource): EnergyReading {
    return new EnergyReading({
      id: resource.id ?? 0,
      period: resource.period ?? 'semana',
      labels: resource.labels ?? [],
      values: resource.values ?? []
    });
  }

  toEntities(resources: EnergyReadingResource[]): EnergyReading[] {
    return resources.map(r => this.toEntity(r));
  }
}

export class DeviceDistributionAssembler {
  toEntity(resource: DeviceDistributionResource, index = 0): DeviceDistribution {
    return new DeviceDistribution({
      id: resource.deviceId ?? resource.id ?? index + 1,
      name: resource.deviceName ?? resource.name ?? `Dispositivo ${index + 1}`,
      percentage: Number((resource.percentage ?? 0).toFixed(1)),
      kwh: Number((resource.totalKwh ?? resource.kwh ?? 0).toFixed(2)),
      color: resource.color || DISTRIBUTION_PALETTE[index % DISTRIBUTION_PALETTE.length]
    });
  }

  toEntities(resources: DeviceDistributionResource[]): DeviceDistribution[] {
    return (resources ?? []).map((r, index) => this.toEntity(r, index));
  }
}

export class ComparativeConsumptionAssembler {
  toEntity(resource: ComparativeConsumptionResource, index = 0): ComparativeConsumption {
    return new ComparativeConsumption({
      id: resource.id ?? index + 1,
      month: resource.label ?? resource.month ?? '',
      currentPeriod: Number((resource.currentPeriodKwh ?? resource.currentPeriod ?? 0).toFixed(2)),
      previousPeriod: Number((resource.previousPeriodKwh ?? resource.previousPeriod ?? 0).toFixed(2))
    });
  }

  toEntities(resources: ComparativeConsumptionResource[]): ComparativeConsumption[] {
    return (resources ?? []).map((r, index) => this.toEntity(r, index));
  }
}

export class ConsumptionHistoryAssembler {
  toEntity(resource: ConsumptionHistoryResource): ConsumptionHistory {
    const rawDate = resource.recordedAt ?? resource.date ?? '';
    const formattedDate = rawDate ? rawDate.slice(0, 10) : '';
    const formattedConsumption =
      resource.consumption ??
      (resource.energyKwh != null ? `${Number(resource.energyKwh).toFixed(2)} kWh` : '0.00 kWh');
    const formattedCost =
      typeof resource.cost === 'number'
        ? `S/ ${resource.cost.toFixed(2)}`
        : resource.cost || 'S/ 0.00';
    const normalizedStatus: 'Normal' | 'Alto' =
      resource.status === 'Alto' ? 'Alto' : 'Normal';

    return new ConsumptionHistory({
      id: resource.id,
      date: formattedDate,
      consumption: formattedConsumption,
      cost: formattedCost,
      status: normalizedStatus
    });
  }

  toEntities(resources: ConsumptionHistoryResource[]): ConsumptionHistory[] {
    return (resources ?? []).map(r => this.toEntity(r));
  }
}

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

export class ConsumptionSummaryAssembler {
  toEntity(resource: ConsumptionSummaryResource): ConsumptionSummary {
    return new ConsumptionSummary({
      id: resource.id,
      totalConsumption: resource.totalConsumption,
      totalConsumptionDiff: resource.totalConsumptionDiff,
      totalConsumptionDiffLabel: resource.totalConsumptionDiffLabel,
      periodConsumption: resource.periodConsumption,
      periodConsumptionDiff: resource.periodConsumptionDiff,
      currentPower: resource.currentPower,
      activeDevicesCount: resource.activeDevicesCount,
      baselineMonthlyKwh: resource.baselineMonthlyKwh ?? 196.8,
      savedKwhWeekly: resource.savedKwhWeekly ?? 9.71,
      savedKwhMonthly: resource.savedKwhMonthly ?? 114.4
    });
  }
}

export class EnergyReadingAssembler {
  toEntity(resource: EnergyReadingResource): EnergyReading {
    return new EnergyReading({
      id: resource.id,
      period: resource.period,
      labels: resource.labels,
      values: resource.values
    });
  }

  toEntities(resources: EnergyReadingResource[]): EnergyReading[] {
    return resources.map(r => this.toEntity(r));
  }
}

export class DeviceDistributionAssembler {
  toEntity(resource: DeviceDistributionResource): DeviceDistribution {
    return new DeviceDistribution({
      id: resource.id,
      name: resource.name,
      percentage: resource.percentage,
      kwh: resource.kwh,
      color: resource.color
    });
  }

  toEntities(resources: DeviceDistributionResource[]): DeviceDistribution[] {
    return resources.map(r => this.toEntity(r));
  }
}

export class ComparativeConsumptionAssembler {
  toEntity(resource: ComparativeConsumptionResource): ComparativeConsumption {
    return new ComparativeConsumption({
      id: resource.id,
      month: resource.month,
      currentPeriod: resource.currentPeriod,
      previousPeriod: resource.previousPeriod
    });
  }

  toEntities(resources: ComparativeConsumptionResource[]): ComparativeConsumption[] {
    return resources.map(r => this.toEntity(r));
  }
}

export class ConsumptionHistoryAssembler {
  toEntity(resource: ConsumptionHistoryResource): ConsumptionHistory {
    return new ConsumptionHistory({
      id: resource.id,
      date: resource.date,
      consumption: resource.consumption,
      cost: resource.cost,
      status: resource.status
    });
  }

  toEntities(resources: ConsumptionHistoryResource[]): ConsumptionHistory[] {
    return resources.map(r => this.toEntity(r));
  }
}

import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnergyCalculationService } from './energy-calculation.constants';

export interface ConsumptionSummaryProps {
  id: number;
  totalConsumption: number;
  totalConsumptionDiff: number;
  totalConsumptionDiffLabel: string;
  periodConsumption: number;
  periodConsumptionDiff: number;
  currentPower: number;
  activeDevicesCount: number;
  baselineMonthlyKwh: number;
  savedKwhWeekly: number;
  savedKwhMonthly: number;
}

export class ConsumptionSummary implements BaseEntity {
  readonly id: number;
  readonly totalConsumption: number;
  readonly totalConsumptionDiff: number;
  readonly totalConsumptionDiffLabel: string;
  readonly periodConsumption: number;
  readonly periodConsumptionDiff: number;
  readonly currentPower: number;
  readonly activeDevicesCount: number;
  readonly baselineMonthlyKwh: number;
  readonly savedKwhWeekly: number;
  readonly savedKwhMonthly: number;

  constructor(props: ConsumptionSummaryProps) {
    this.id = props.id;
    this.totalConsumption = props.totalConsumption;
    this.totalConsumptionDiff = props.totalConsumptionDiff;
    this.totalConsumptionDiffLabel = props.totalConsumptionDiffLabel;
    this.periodConsumption = props.periodConsumption;
    this.periodConsumptionDiff = props.periodConsumptionDiff;
    this.currentPower = props.currentPower;
    this.activeDevicesCount = props.activeDevicesCount;
    this.baselineMonthlyKwh = props.baselineMonthlyKwh;
    this.savedKwhWeekly = props.savedKwhWeekly;
    this.savedKwhMonthly = props.savedKwhMonthly;
  }

  /**
   * Costo calculado para el consumo total: kWh * S/ 0.70
   */
  get estimatedCost(): number {
    return EnergyCalculationService.calculateCost(this.totalConsumption);
  }

  /**
   * Costo calculado para el consumo del período actual: kWh * S/ 0.70
   */
  get periodEstimatedCost(): number {
    return EnergyCalculationService.calculateCost(this.periodConsumption);
  }

  /**
   * Ahorro económico estimado en el período: kWh_ahorrado * S/ 0.70
   */
  get estimatedSavings(): number {
    return EnergyCalculationService.calculateCost(this.savedKwhWeekly);
  }

  /**
   * Emisiones evitadas de CO2 en kg en el mes: kWh_ahorrado * 0.25 kg CO2/kWh
   */
  get avoidedEmissionsKg(): number {
    return EnergyCalculationService.calculateAvoidedEmissions(this.savedKwhMonthly);
  }

  /**
   * Equivalencia ecológica en árboles plantados
   */
  get avoidedEmissionsEquivalence(): string {
    return EnergyCalculationService.formatTreeEquivalence(this.avoidedEmissionsKg);
  }
}

import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnergyCalculationService } from '../../../shared/domain/model/energy-calculation.constants';

export interface DeviceSummaryProps {
  id: number;
  connectedDevices: number;
  waitingDevices: number;
  totalPowerKw: number;
  powerDiffVsYesterday?: number;
  powerDiffVsYesterdayLabel?: string;
  costDiffVsMonth?: number;
  costDiffVsMonthLabel?: string;
  savedKwhMonthly?: number;
  estimatedCostSoles?: number;
}

/**
 * Domain entity for aggregated device metrics displayed in header metric cards.
 * Solo utiliza los datos entregados por la colección `device-summaries` de db.json.
 */
export class DeviceSummary implements BaseEntity {
  readonly id: number;
  readonly connectedDevices: number;
  readonly waitingDevices: number;
  readonly totalPowerKw: number;
  readonly powerDiffVsYesterday: number;
  readonly powerDiffVsYesterdayLabel: string;
  readonly costDiffVsMonth: number;
  readonly costDiffVsMonthLabel: string;
  readonly savedKwhMonthly: number;
  private readonly _estimatedCostSoles?: number;

  constructor(props: DeviceSummaryProps) {
    this.id = props.id;
    this.connectedDevices = props.connectedDevices;
    this.waitingDevices = props.waitingDevices;
    this.totalPowerKw = props.totalPowerKw;
    this.powerDiffVsYesterday = props.powerDiffVsYesterday ?? 0;
    this.powerDiffVsYesterdayLabel = props.powerDiffVsYesterdayLabel ?? '';
    this.costDiffVsMonth = props.costDiffVsMonth ?? 0;
    this.costDiffVsMonthLabel = props.costDiffVsMonthLabel ?? '';
    this.savedKwhMonthly = props.savedKwhMonthly ?? 0;
    this._estimatedCostSoles = props.estimatedCostSoles;
  }

  /**
   * Costo mensual estimado en Soles (S/): el valor de db.json si existe, o 0.
   */
  get estimatedCostSoles(): number {
    return this._estimatedCostSoles ?? 0;
  }

  /**
   * Emisiones evitadas de CO2 (kg): kWh_ahorrado * 0.25 kg CO2/kWh
   */
  get co2AvoidedKg(): number {
    return EnergyCalculationService.calculateAvoidedEmissions(this.savedKwhMonthly);
  }

  /**
   * Equivalencia ecológica en árboles
   */
  get treeEquivalence(): string {
    return EnergyCalculationService.formatTreeEquivalence(this.co2AvoidedKg);
  }
}

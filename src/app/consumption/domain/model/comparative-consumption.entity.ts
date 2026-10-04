import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface ComparativeConsumptionProps {
  id: number;
  month: string;
  currentPeriod: number;
  previousPeriod: number;
}

export class ComparativeConsumption implements BaseEntity {
  readonly id: number;
  readonly month: string;
  readonly currentPeriod: number;
  readonly previousPeriod: number;

  constructor(props: ComparativeConsumptionProps) {
    this.id = props.id;
    this.month = props.month;
    this.currentPeriod = props.currentPeriod;
    this.previousPeriod = props.previousPeriod;
  }
}

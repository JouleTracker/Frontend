import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface ConsumptionHistoryProps {
  id: number;
  date: string;
  consumption: string;
  cost: string;
  status: 'Normal' | 'Alto';
}

export class ConsumptionHistory implements BaseEntity {
  readonly id: number;
  readonly date: string;
  readonly consumption: string;
  readonly cost: string;
  readonly status: 'Normal' | 'Alto';

  constructor(props: ConsumptionHistoryProps) {
    this.id = props.id;
    this.date = props.date;
    this.consumption = props.consumption;
    this.cost = props.cost;
    this.status = props.status;
  }
}

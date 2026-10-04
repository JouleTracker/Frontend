import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface DeviceDistributionProps {
  id: number;
  name: string;
  percentage: number;
  kwh: number;
  color: string;
}

export class DeviceDistribution implements BaseEntity {
  readonly id: number;
  readonly name: string;
  readonly percentage: number;
  readonly kwh: number;
  readonly color: string;

  constructor(props: DeviceDistributionProps) {
    this.id = props.id;
    this.name = props.name;
    this.percentage = props.percentage;
    this.kwh = props.kwh;
    this.color = props.color;
  }
}

import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface EnergyReadingProps {
  id: number;
  period: 'dia' | 'semana' | 'mes' | 'ano';
  labels: string[];
  values: number[];
}

export class EnergyReading implements BaseEntity {
  readonly id: number;
  readonly period: 'dia' | 'semana' | 'mes' | 'ano';
  readonly labels: string[];
  readonly values: number[];

  constructor(props: EnergyReadingProps) {
    this.id = props.id;
    this.period = props.period;
    this.labels = props.labels;
    this.values = props.values;
  }
}

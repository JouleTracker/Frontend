import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnergyCalculationService } from '../../../shared/domain/model/energy-calculation.constants';

export interface AreaProps {
  id: number;
  name: string;
  description?: string;
  floor?: string;
  icon?: string;
  userId?: number;
}

/**
 * Domain entity representing a physical area/zone of a business or household in JouleTracker.
 */
export class Area implements BaseEntity {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly floor: string;
  readonly icon: string;
  readonly userId: number;

  constructor(props: AreaProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description ?? '';
    this.floor = props.floor ?? 'Piso 1';
    this.icon = props.icon ?? 'storefront';
    this.userId = props.userId ?? 1;
  }
}

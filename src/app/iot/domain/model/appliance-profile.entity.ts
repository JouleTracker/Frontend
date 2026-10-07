import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface ApplianceProfileProps {
  id: number;
  name: string;
  recommendedDailyKwh: number;
  typicalPowerWatts: string;
  icon: string;
}

/**
 * Domain entity representing a recurring domestic appliance profile with its real-world consumption benchmark.
 */
export class ApplianceProfile implements BaseEntity {
  readonly id: number;
  readonly name: string;
  readonly recommendedDailyKwh: number;
  readonly typicalPowerWatts: string;
  readonly icon: string;

  constructor(props: ApplianceProfileProps) {
    this.id = props.id;
    this.name = props.name;
    this.recommendedDailyKwh = props.recommendedDailyKwh;
    this.typicalPowerWatts = props.typicalPowerWatts;
    this.icon = props.icon;
  }
}

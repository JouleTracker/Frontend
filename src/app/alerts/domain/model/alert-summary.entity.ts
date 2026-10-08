import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface AlertSummaryProps {
  id: number;
  activeCount: number;
  resolvedCount: number;
  totalCount: number;
  reductionPercentage: number;
  reductionLabel: string;
}

/**
 * Domain entity representing aggregated metrics for alerts.
 */
export class AlertSummary implements BaseEntity {
  readonly id: number;
  readonly activeCount: number;
  readonly resolvedCount: number;
  readonly totalCount: number;
  readonly reductionPercentage: number;
  readonly reductionLabel: string;

  constructor(props: AlertSummaryProps) {
    this.id = props.id;
    this.activeCount = props.activeCount;
    this.resolvedCount = props.resolvedCount;
    this.totalCount = props.totalCount;
    this.reductionPercentage = props.reductionPercentage;
    this.reductionLabel = props.reductionLabel;
  }
}

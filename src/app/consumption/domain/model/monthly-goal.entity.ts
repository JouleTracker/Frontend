import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface MonthlyGoalProps {
  id: number;
  userId: number;
  targetKwh: number;
  year: number;
  month: number;
  currentKwh: number;
  progressPercentage: number;
  remainingKwh: number;
  exceeded: boolean;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export class MonthlyGoal implements BaseEntity {
  readonly id: number;
  readonly userId: number;
  readonly targetKwh: number;
  readonly year: number;
  readonly month: number;
  readonly currentKwh: number;
  readonly progressPercentage: number;
  readonly remainingKwh: number;
  readonly exceeded: boolean;

  constructor(props: MonthlyGoalProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.targetKwh = props.targetKwh;
    this.year = props.year;
    this.month = props.month;
    this.currentKwh = props.currentKwh;
    this.progressPercentage = props.progressPercentage;
    this.remainingKwh = props.remainingKwh;
    this.exceeded = props.exceeded;
  }

  get clampedProgress(): number {
    return Math.min(100, Math.max(0, Number(this.progressPercentage.toFixed(1))));
  }

  get statusLevel(): 'normal' | 'warning' | 'exceeded' {
    if (this.exceeded || this.progressPercentage >= 100) return 'exceeded';
    if (this.progressPercentage >= 80) return 'warning';
    return 'normal';
  }

  get formattedPeriod(): string {
    const name = MONTH_NAMES_ES[this.month - 1] ?? `Mes ${this.month}`;
    return `${name} ${this.year}`;
  }

  get exceededByKwh(): number {
    if (!this.exceeded) return 0;
    return Number(Math.max(0, this.currentKwh - this.targetKwh).toFixed(2));
  }
}
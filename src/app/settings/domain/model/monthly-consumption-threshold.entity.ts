export interface MonthlyConsumptionThreshold {
  userId: number;
  monthlyLimitKwh: number | null;
  configured: boolean;
}

export interface UpdateMonthlyConsumptionThreshold {
  monthlyLimitKwh: number;
}

export interface MonthlyConsumptionStatus {
  userId: number;
  period: string;
  configured: boolean;
  monthlyLimitKwh: number | null;
  currentConsumptionKwh: number;
  remainingKwh: number | null;
  consumptionPercentage: number | null;
  thresholdReached: boolean;
}

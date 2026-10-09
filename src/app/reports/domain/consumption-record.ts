export interface ConsumptionRecord {
  readonly date: string;
  readonly consumptionKwh: number;
}

export type ReportPeriod = '7' | '30' | 'month' | 'custom';

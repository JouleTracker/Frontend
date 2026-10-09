export interface ConsumptionRecord {
  readonly id?: number;
  readonly date: string;
  readonly consumptionKwh: number;
}

export interface ReportsConfig {
  readonly kwhRate: number;
}

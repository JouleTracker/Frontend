export interface ConsumptionRecord {
  readonly id?: number;
  /** Fecha en formato ISO (YYYY-MM-DD) */
  readonly date: string;
  readonly consumptionKwh: number;
}

import { ConsumptionRecord } from '../domain/consumption-record';

// Demo only: this tariff is not a utility tariff or a backend calculation.
export const DEMO_RATE_PER_KWH = 0.75;

export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// A rolling 60-day fixture keeps the initial preview useful without a server.
export function createConsumptionMock(today = new Date()): readonly ConsumptionRecord[] {
  return Array.from({ length: 60 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 59 + index);
    return { date: localDate(date), consumptionKwh: Number((6 + (index % 7) * 0.8 + (index % 3) * 0.35).toFixed(2)) };
  });
}

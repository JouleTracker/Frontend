export interface Recommendation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'Ahorro energético' | 'Consumo elevado' | 'Horarios de consumo' | 'Uso eficiente de dispositivos';
  readonly icon: string;
}

export interface ConsumptionOverview {
  readonly period: string;
  readonly level: string;
  readonly trend: string;
  readonly consumptionKwh: number;
}

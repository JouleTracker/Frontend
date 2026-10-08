import { ConsumptionOverview, Recommendation } from '../domain/recommendation';

// Illustrative fixture, not recommendations inferred from real measurements.
export const MOCK_CONSUMPTION_OVERVIEW: ConsumptionOverview = {
  period: 'Semana de ejemplo', level: 'Moderado', trend: 'Estable', consumptionKwh: 61.95,
};

export const MOCK_RECOMMENDATIONS: readonly Recommendation[] = [
  { id: 'standby', title: 'Reduce el consumo en espera', description: 'Apaga y desconecta los equipos que no estés utilizando. Revisa cargadores, televisores y otros dispositivos que permanecen conectados.', category: 'Ahorro energético', icon: 'energy_savings_leaf' },
  { id: 'high-usage', title: 'Revisa los días de mayor consumo', description: 'Consulta el historial de Reportes y compara los días con mayor consumo. Identifica qué actividades o equipos utilizaste durante esos días.', category: 'Consumo elevado', icon: 'bar_chart' },
  { id: 'schedule', title: 'Organiza tus horarios de uso', description: 'Evita dejar luces y equipos encendidos durante horas sin necesidad. Ajusta sus horarios de funcionamiento a tu rutina diaria.', category: 'Horarios de consumo', icon: 'schedule' },
  { id: 'devices', title: 'Utiliza tus dispositivos de forma eficiente', description: 'Aprovecha cargas completas en la lavadora y utiliza los modos de ahorro disponibles. Mantén los equipos según las indicaciones del fabricante.', category: 'Uso eficiente de dispositivos', icon: 'devices' },
];

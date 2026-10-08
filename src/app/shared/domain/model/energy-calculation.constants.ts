/**
 * Constantes y factores de cálculo del dominio para JouleTracker.
 *
 * Basados en normativas peruanas y estándares internacionales:
 * - Tarifa eléctrica de referencia (Perú - OSINERGMIN BT5B residencial promedio): S/ 0.70 por kWh.
 * - Factor de emisión de la red eléctrica nacional (SEIN - Perú): 0.25 kg CO2 por kWh.
 * - Factor de absorción de CO2 por árbol urbano promedio (EPA / estándares forestales): 25.0 kg CO2 al año.
 */
export const ELECTRICITY_TARIFF_PER_KWH = 0.70; // Soles por kWh
export const CO2_EMISSION_FACTOR_PER_KWH = 0.25; // kg CO2 por kWh
export const TREE_ABSORPTION_FACTOR_KG = 25.0; // kg CO2 absorbidos por árbol al año

/**
 * Servicio de dominio con funciones puras para cálculos de energía y sostenibilidad.
 */
export class EnergyCalculationService {
  /**
   * Calcula el costo en Soles (S/) dado un consumo en kWh.
   */
  static calculateCost(kwh: number, tariff: number = ELECTRICITY_TARIFF_PER_KWH): number {
    if (kwh <= 0) return 0;
    return Number((kwh * tariff).toFixed(2));
  }

  /**
   * Calcula las emisiones evitadas de CO2 (en kg) dado el ahorro de energía en kWh.
   * Fórmula: kWh_ahorrado * 0.25 kg CO2/kWh
   */
  static calculateAvoidedEmissions(savedKwh: number, factor: number = CO2_EMISSION_FACTOR_PER_KWH): number {
    if (savedKwh <= 0) return 0;
    return Number((savedKwh * factor).toFixed(2));
  }

  /**
   * Calcula la energía ahorrada (kWh) respecto a una línea base de consumo.
   */
  static calculateSavedKwh(baselineKwh: number, currentKwh: number): number {
    const diff = baselineKwh - currentKwh;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  }

  /**
   * Calcula el número equivalente de árboles plantados en base a las emisiones evitadas.
   */
  static calculateEquivalentTrees(avoidedEmissionsKg: number): number {
    if (avoidedEmissionsKg <= 0) return 0;
    return Math.max(1, Math.round(avoidedEmissionsKg / TREE_ABSORPTION_FACTOR_KG));
  }

  /**
   * Genera el texto descriptivo de la equivalencia ecológica.
   */
  static formatTreeEquivalence(avoidedEmissionsKg: number): string {
    const trees = this.calculateEquivalentTrees(avoidedEmissionsKg);
    return trees === 1 ? 'Equivale a 1 árbol' : `Equivale a ${trees} árboles`;
  }
}

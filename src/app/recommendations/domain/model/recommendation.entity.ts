/**
 * Métricas de recomendaciones derivadas únicamente de datos reales de db.json
 * (colecciones `recommendations` y `consumption-summaries` del usuario).
 */
export interface RecommendationMetrics {
  readonly potentialSavings: string;
  readonly estimatedReduction: string;
  readonly co2Avoided: string;
  readonly activeCount: number;
}

/**
 * Recommendation entity: solo los campos reales de la colección `recommendations` de db.json.
 */
export interface RecommendationItem {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly category: string;
  readonly potentialSaving: string;
  readonly actionUrl: string;
}

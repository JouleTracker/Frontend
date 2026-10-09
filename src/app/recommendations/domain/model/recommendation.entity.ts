export interface RecommendationMetrics {
  readonly potentialSavings: string;
  readonly estimatedReduction: string;
  readonly co2Avoided: string;
  readonly activeCount: number;
}

export interface RecommendationItem {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly category: 'Ahorro en casa' | 'Dispositivos' | 'Hábitos' | 'Medio ambiente';
  readonly savings: string;
  readonly savingsType: 'money' | 'eco';
  readonly imageUrl: string;
  readonly impactScore: number;
}

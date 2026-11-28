export type RecommendationCategory = 'SAVING' | 'EFFICIENCY' | 'MAINTENANCE' | 'GENERAL';

export interface RecommendationMetrics {
  readonly totalEstimatedSavingKwh: number;
  readonly totalEstimatedSavingAmount: number;
  readonly potentialSavings: string;
  readonly estimatedReduction: string;
  readonly co2Avoided: string;
  readonly activeCount: number;
  readonly completedCount: number;
}

export interface RecommendationItem {
  readonly id: number;
  readonly userId: number;
  readonly title: string;
  readonly description: string;
  readonly estimatedSavingKwh: number;
  readonly estimatedSavingAmount: number;
  readonly category: RecommendationCategory | string;
  readonly completed: boolean;
  readonly createdAt: string;
}

export interface CreateRecommendationPayload {
  readonly userId: number;
  readonly title: string;
  readonly description: string;
  readonly estimatedSavingKwh: number | null;
  readonly estimatedSavingAmount: number | null;
  readonly category: RecommendationCategory;
}

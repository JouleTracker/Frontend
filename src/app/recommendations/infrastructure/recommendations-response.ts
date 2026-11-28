import { BaseResource } from '../../shared/infrastructure/base-response';

export interface RecommendationResource extends BaseResource {
  userId: number;
  title: string;
  description: string;
  estimatedSavingKwh: number | null;
  estimatedSavingAmount: number | null;
  category: string;
  completed: boolean;
  createdAt: string;
}

export interface CreateRecommendationRequest {
  userId: number;
  title: string;
  description: string;
  estimatedSavingKwh: number | null;
  estimatedSavingAmount: number | null;
  category: string;
}

export type RecommendationResponse = RecommendationResource[];

import { BaseResource } from '../../shared/infrastructure/base-response';

export interface RecommendationResource extends BaseResource {
  title: string;
  description: string;
  icon: string;
  category: string;
  potentialSaving: string;
  actionUrl: string;
}

export type RecommendationResponse = RecommendationResource[];

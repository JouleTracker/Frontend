import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Forma real de un registro en la colección `recommendations` de db.json.
 */
export interface RecommendationResource extends BaseResource {
  userId?: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  potentialSaving: string;
  actionUrl: string;
}

export type RecommendationResponse = RecommendationResource[];

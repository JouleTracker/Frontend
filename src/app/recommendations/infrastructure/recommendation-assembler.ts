import { RecommendationResource } from './recommendation-response';
import { Recommendation } from '../domain/model/recommendation.entity';

export class RecommendationAssembler {
  toEntity(resource: RecommendationResource): Recommendation {
    return new Recommendation({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      icon: resource.icon,
      category: resource.category,
      potentialSaving: resource.potentialSaving,
      actionUrl: resource.actionUrl
    });
  }

  toEntities(resources: RecommendationResource[]): Recommendation[] {
    return resources.map(r => this.toEntity(r));
  }
}

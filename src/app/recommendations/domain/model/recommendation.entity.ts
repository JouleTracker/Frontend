import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface RecommendationProps {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  potentialSaving: string;
  actionUrl: string;
}

export class Recommendation implements BaseEntity {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly category: string;
  readonly potentialSaving: string;
  readonly actionUrl: string;

  constructor(props: RecommendationProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.icon = props.icon;
    this.category = props.category;
    this.potentialSaving = props.potentialSaving;
    this.actionUrl = props.actionUrl;
  }
}

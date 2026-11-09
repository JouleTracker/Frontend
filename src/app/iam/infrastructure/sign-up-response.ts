import { SubscriptionPlan } from '../domain/model/user.entity';

export interface SignUpResponse {
  id: number;
  name: string;
  email: string;
  role?: string;
  plan?: SubscriptionPlan;
}

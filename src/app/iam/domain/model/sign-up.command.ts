import { SubscriptionPlan } from './user.entity';

export interface SignUpCommand {
  name: string;
  email: string;
  password: string;
  role?: string;
  plan?: SubscriptionPlan;
}

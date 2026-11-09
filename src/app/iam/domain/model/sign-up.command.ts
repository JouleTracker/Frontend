import { SubscriptionPlan, UserRole } from './user.entity';

export interface SignUpCommand {
  name: string;
  email: string;
  password: string;
  role?: UserRole | string;
  plan?: SubscriptionPlan;
}

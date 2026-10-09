export type SubscriptionPlan = 'starter' | 'plus' | 'pro';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  token?: string;
  verified?: boolean;
  plan?: SubscriptionPlan;
}

import { SubscriptionPlan, User, UserBusiness, UserHome, UserNotifications } from '../domain/model/user.entity';

export interface SignInResponse {
  id: number;
  name: string;
  email: string;
  token?: string;
  role?: string;
  plan?: SubscriptionPlan;
  phone?: string;
  home?: UserHome;
  business?: UserBusiness;
  notifications?: UserNotifications;
  user?: User;
}

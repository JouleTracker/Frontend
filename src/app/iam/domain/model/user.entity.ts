export type SubscriptionPlan = 'starter' | 'plus' | 'pro';

export interface UserHome {
  homeType?: string;
  occupants?: number;
  location?: string;
  tariff?: string;
}

export interface UserNotifications {
  highConsumptionAlerts?: boolean;
  maintenanceReminders?: boolean;
  personalizedTips?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  token?: string;
  verified?: boolean;
  plan?: SubscriptionPlan;
  phone?: string;
  home?: UserHome;
  notifications?: UserNotifications;
}

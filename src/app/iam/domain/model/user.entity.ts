export type SubscriptionPlan = 'starter' | 'plus' | 'pro';
export type UserRole = 'admin' | 'homeowner' | 'business';
export type UserStatus = 'ACTIVE' | 'BANNED' | 'SUSPENDED' | 'INACTIVE';

export interface UserHome {
  homeType?: string;
  occupants?: number;
  location?: string;
  tariff?: string;
}

export interface UserBusiness {
  businessName?: string;
  taxId?: string;
  businessType?: string;
  commercialTariff?: string;
  address?: string;
}

export interface UserNotifications {
  highConsumptionAlerts?: boolean;
  maintenanceReminders?: boolean;
  personalizedTips?: boolean;
}

/**
 * Core IAM User entity representing an authenticated or managed JouleTracker account.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role?: UserRole | string;
  token?: string;
  verified?: boolean;
  status?: UserStatus;
  banned?: boolean;
  plan?: SubscriptionPlan;
  phone?: string;
  home?: UserHome;
  business?: UserBusiness;
  notifications?: UserNotifications;
}

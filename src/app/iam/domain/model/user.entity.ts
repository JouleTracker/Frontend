export type SubscriptionPlan = 'starter' | 'plus' | 'pro';
export type UserRole = 'admin' | 'homeowner' | 'business';

export interface UserHome {
  homeType?: string;
  occupants?: number;
  location?: string;
  tariff?: string;
}

export interface UserBusiness {
  businessName?: string;
  taxId?: string; // RUC
  businessType?: string; // Restaurante, Taller, Bodega, Oficina, etc.
  commercialTariff?: string; // BT5B Comercial, MT2, etc.
  address?: string;
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
  role?: UserRole | string;
  token?: string;
  verified?: boolean;
  banned?: boolean;
  plan?: SubscriptionPlan;
  phone?: string;
  home?: UserHome;
  business?: UserBusiness;
  notifications?: UserNotifications;
}

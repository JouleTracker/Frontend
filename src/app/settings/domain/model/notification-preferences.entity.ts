export interface NotificationPreferences {
  userId: number;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
}

export interface UpdateNotificationPreferences {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
}

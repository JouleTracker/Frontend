import { FormControl, ValidatorFn, Validators } from '@angular/forms';

export function parseNotificationRecipients(value: string): string[] {
  return [...new Set(
    value
      .split(/[,;\n]+/)
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  )];
}

export const notificationRecipientsValidator: ValidatorFn = control => {
  const recipients = parseNotificationRecipients(
    String(control.value ?? '')
  );

  const invalid = recipients.some(email =>
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    Validators.email(new FormControl(email)) !== null
  );

  return invalid ? { invalidRecipients: true } : null;
};

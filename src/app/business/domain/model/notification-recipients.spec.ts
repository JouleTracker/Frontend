import { FormControl } from '@angular/forms';
import {
  parseNotificationRecipients,
  notificationRecipientsValidator
} from './notification-recipients';

describe('Notification recipients', () => {
  it('should parse comma-separated emails', () => {
    expect(
      parseNotificationRecipients(
        'one@example.com, two@example.com'
      )
    ).toEqual([
      'one@example.com',
      'two@example.com'
    ]);
  });

  it('should support semicolons and line breaks', () => {
    expect(
      parseNotificationRecipients(
        'one@example.com;two@example.com\nthree@example.com'
      )
    ).toEqual([
      'one@example.com',
      'two@example.com',
      'three@example.com'
    ]);
  });

  it('should normalize and remove duplicate emails', () => {
    expect(
      parseNotificationRecipients(
        ' ADMIN@example.com, admin@example.com '
      )
    ).toEqual(['admin@example.com']);
  });

  it('should return an empty list when clearing recipients', () => {
    expect(parseNotificationRecipients('')).toEqual([]);
  });

  it('should ignore empty entries', () => {
    expect(
      parseNotificationRecipients(',,; one@example.com;')
    ).toEqual(['one@example.com']);
  });

  it('should accept valid email addresses', () => {
    const control = new FormControl(
      'admin@example.com, supervisor@example.com'
    );

    expect(
      notificationRecipientsValidator(control)
    ).toBeNull();
  });

  it('should allow an empty recipient list', () => {
    expect(
      notificationRecipientsValidator(new FormControl(''))
    ).toBeNull();
  });

  it('should reject malformed emails', () => {
    const control = new FormControl(
      'admin@example.com, invalid-email'
    );

    expect(
      notificationRecipientsValidator(control)
    ).toEqual({ invalidRecipients: true });
  });

  it('should reject an email without a domain suffix', () => {
    expect(
      notificationRecipientsValidator(
        new FormControl('admin@localhost')
      )
    ).toEqual({ invalidRecipients: true });
  });

  it('should reject excessively long email addresses', () => {
    const email = `${'a'.repeat(255)}@example.com`;

    expect(
      notificationRecipientsValidator(new FormControl(email))
    ).toEqual({ invalidRecipients: true });
  });
});

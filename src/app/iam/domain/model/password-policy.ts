import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/**
 * Shared password policy aligned with the JouleTracker Spring Boot IAM backend:
 * - Length between 8 and 64 characters
 * - At least one lowercase letter, one uppercase letter, one digit, and one special character
 * - No whitespace characters
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S+$/;

/**
 * Returns Angular validators enforcing the JouleTracker password policy.
 */
export function passwordPolicyValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(PASSWORD_MIN_LENGTH),
    Validators.maxLength(PASSWORD_MAX_LENGTH),
    Validators.pattern(PASSWORD_POLICY_REGEX)
  ];
}

/**
 * Creates a cross-field FormGroup validator ensuring the confirmation password
 * control matches the primary password control.
 */
export function createPasswordMatchValidator(
  passwordControlName = 'password',
  confirmControlName = 'confirmPassword'
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordControlName)?.value;
    const confirmControl = control.get(confirmControlName);
    const confirmPassword = confirmControl?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      confirmControl?.setErrors({ ...confirmControl.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmControl?.hasError('passwordMismatch')) {
      const errors = { ...confirmControl.errors };
      delete errors['passwordMismatch'];
      confirmControl.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  };
}

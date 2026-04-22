import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const noWhitespaceValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;
  if (value == null || value === '') {
    return null;
  }
  return /\s/.test(String(value)) ? { hasWhitespace: true } : null;
};

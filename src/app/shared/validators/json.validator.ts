import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function JsonValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const error: ValidationErrors = { jsonInvalid: true };

    const value = control.value;

    try {
      JSON.parse(value);
    } catch (e) {
      control.setErrors(error);
      return error;
    }

    control.setErrors(null);
    return null;
  };
}

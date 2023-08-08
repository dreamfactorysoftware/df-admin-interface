import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchValidator(fieldToMatch: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;

    if (parent) {
      const matchingField = parent.get(fieldToMatch);

      if (matchingField && control.value !== matchingField.value) {
        return { doesNotMatch: true };
      }
    }

    return null;
  };
}

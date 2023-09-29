import { AbstractControl, ValidationErrors } from '@angular/forms';

export function CsvValidator(
  control: AbstractControl
): ValidationErrors | null {
  if (control.value && control.value.length > 0) {
    const regex = /^\w+(?:\s*,\s*\w+)*$/;
    const isCsv = regex.test(control.value);

    if (!isCsv)
      return {
        csvInvalid: true,
      };
  }

  return null;
}

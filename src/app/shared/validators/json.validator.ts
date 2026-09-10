import { AbstractControl, ValidationErrors } from '@angular/forms';

export function JsonValidator(
  control: AbstractControl
): ValidationErrors | null {
  if (control.value.length > 0) {
    try {
      JSON.parse(control.value);
    } catch (e) {
      return { jsonInvalid: true };
    }
  }

  return null;
}

// Like JsonValidator, but the text must be a JSON object (blank is allowed).
// For fields the API treats as a keyed map, where a string/array/number would be
// saved but never applied.
export function JsonObjectValidator(
  control: AbstractControl
): ValidationErrors | null {
  const text = control.value;
  if (!text || !text.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return { jsonInvalid: true };
    }
  } catch (e) {
    return { jsonInvalid: true };
  }

  return null;
}

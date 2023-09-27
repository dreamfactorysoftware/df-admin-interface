import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export const uniqueNameValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const nameMap = new Map<string, number>();

  const formArray = control as FormArray;

  formArray.controls.forEach((control, index) => {
    if (!(control instanceof FormGroup)) {
      return;
    }

    const nameControl = control.get('name');

    if (!nameControl) {
      return;
    }

    const name = nameControl.value;

    if (!name) {
      return;
    }

    if (nameMap.has(name)) {
      const firstIndex = nameMap.get(name);
      setErrors(firstIndex ?? 0);
      setErrors(index);
    } else {
      nameMap.set(name, index);
      clearErrors(index);
    }
  });

  function setErrors(index: number) {
    const group = formArray.at(index) as FormGroup;
    const nameControl = group.get('name');
    nameControl?.setErrors({ notUnique: true });
  }

  function clearErrors(index: number) {
    const group = formArray.at(index) as FormGroup;
    const nameControl = group.get('name');
    const errors = nameControl?.errors;
    if (errors) {
      delete errors['notUnique'];
      nameControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  return null;
};

import { matchValidator } from './match.validator';
import { FormControl, FormGroup } from '@angular/forms';

describe('matchValidator', () => {
  it('should return null when the fields match', () => {
    const form = new FormGroup({
      password: new FormControl('password'),
      confirmPassword: new FormControl('password'),
    });

    const validator = matchValidator('password');
    const result = validator(form.controls.confirmPassword);

    expect(result).toBeNull();
  });

  it('should return a validation error when the fields do not match', () => {
    const form = new FormGroup({
      password: new FormControl('password'),
      confirmPassword: new FormControl('wrongpassword'),
    });

    const validator = matchValidator('password');
    const result = validator(form.controls.confirmPassword);

    expect(result).toEqual({ doesNotMatch: true });
  });
});

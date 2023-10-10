import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DfLicenseCheckService } from 'src/app/shared/services/df-license-check.service';
import { CheckResponse } from 'src/app/shared/types/check';

export const checkStatusResolver: ResolveFn<CheckResponse> = () => {
  return inject(DfLicenseCheckService).check();
};

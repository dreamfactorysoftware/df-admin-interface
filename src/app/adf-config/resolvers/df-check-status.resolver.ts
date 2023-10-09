import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CheckService } from 'src/app/shared/services/check.service';
import { CheckResponse } from 'src/app/shared/types/check';

export const checkStatusResolver: ResolveFn<CheckResponse> = () => {
  return inject(CheckService).check();
};

import { TestBed } from '@angular/core/testing';

import { DfLimitsService } from './df-limits.service';

describe('DfLimitsService', () => {
  let service: DfLimitsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfLimitsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

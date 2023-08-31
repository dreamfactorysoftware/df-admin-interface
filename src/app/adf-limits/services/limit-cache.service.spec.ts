import { TestBed } from '@angular/core/testing';

import { DfLimitCacheService } from './limit-cache.service';

describe('LimitCacheService', () => {
  let service: DfLimitCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfLimitCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

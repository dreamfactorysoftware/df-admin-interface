import { TestBed } from '@angular/core/testing';

import { DfAppsService } from './df-apps.service';

describe('DfAppsService', () => {
  let service: DfAppsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfAppsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

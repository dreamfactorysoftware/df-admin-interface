import { TestBed } from '@angular/core/testing';

import { SystemConfigDataService } from './system-config-data.service';

describe('SystemConfigDataService', () => {
  let service: SystemConfigDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemConfigDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

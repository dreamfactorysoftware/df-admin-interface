import { TestBed } from '@angular/core/testing';

import { DfServiceReportService } from './service-report.service';

describe('ServiceReportService', () => {
  let service: DfServiceReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfServiceReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

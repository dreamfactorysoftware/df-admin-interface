import { TestBed } from '@angular/core/testing';

import { DfApiDocsService } from './df-api-docs.service';

describe('DfApiDocsService', () => {
  let service: DfApiDocsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfApiDocsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

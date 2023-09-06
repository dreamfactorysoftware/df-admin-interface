import { TestBed } from '@angular/core/testing';

import { DfDatabaseSchemaService } from './df-database-schema.service';

describe('DfDatabaseSchemaService', () => {
  let service: DfDatabaseSchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfDatabaseSchemaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

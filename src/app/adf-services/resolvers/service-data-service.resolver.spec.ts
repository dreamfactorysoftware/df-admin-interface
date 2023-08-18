import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { getSystemServiceDataListResolver } from './service-data-service.resolver';

describe('manageServiceResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() =>
      getSystemServiceDataListResolver(...resolverParameters)
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});

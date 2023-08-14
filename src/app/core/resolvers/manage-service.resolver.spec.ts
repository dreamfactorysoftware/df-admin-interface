import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { getSystemServiceDataResolver } from './manage-service.resolver';

describe('manageServiceResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() =>
      getSystemServiceDataResolver(...resolverParameters)
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});

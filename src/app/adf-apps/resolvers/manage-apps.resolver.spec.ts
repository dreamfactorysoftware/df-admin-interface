import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { getSystemAppDataResolver } from './manage-apps.resolver';

describe('manageServiceResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() =>
      getSystemAppDataResolver(...resolverParameters)
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});

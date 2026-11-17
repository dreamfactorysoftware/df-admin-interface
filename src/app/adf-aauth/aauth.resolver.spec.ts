import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  firstValueFrom,
  of,
  throwError,
} from 'rxjs';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfErrorService } from 'src/app/shared/services/df-error.service';
import { aauthResolver } from './aauth.resolver';

/**
 * AAuth ships in the df-aauth package (GOLD). Without its aauth system
 * resource the page is the shared paywall, whatever the license.
 */
describe('aauthResolver', () => {
  let config: {
    system$: BehaviorSubject<{ resource: { name: string }[] }>;
    fetchSystemData: jest.Mock;
    fetchEnvironmentData: jest.Mock;
  };
  let http: { post: jest.Mock };
  let errors: { error?: unknown };

  function setup(resources: string[], fetched = resources) {
    config = {
      system$: new BehaviorSubject({
        resource: resources.map(name => ({ name })),
      }),
      fetchSystemData: jest.fn(() =>
        of({ resource: fetched.map(name => ({ name })) })
      ),
      fetchEnvironmentData: jest.fn(),
    };
    http = { post: jest.fn(() => of({})) };
    errors = {};
    TestBed.configureTestingModule({
      providers: [
        DfPaywallService,
        { provide: DfSystemConfigDataService, useValue: config },
        { provide: DfErrorService, useValue: errors },
        { provide: HttpClient, useValue: http },
      ],
    });
  }

  const resolve = () =>
    firstValueFrom(
      TestBed.runInInjectionContext(
        () =>
          aauthResolver(
            {} as ActivatedRouteSnapshot,
            {} as RouterStateSnapshot
          ) as Observable<'paywall' | 'ok'>
      )
    );

  afterEach(() => TestBed.resetTestingModule());

  it('shows the paywall when the aauth resource is absent', async () => {
    setup(['user', 'role', 'data_masking']);
    expect(await resolve()).toBe('paywall');
    // The decision itself sends nothing; the paywall component does.
    expect(http.post).not.toHaveBeenCalled();
    expect(config.fetchSystemData).not.toHaveBeenCalled();
  });

  it('opens the page when the aauth resource exists', async () => {
    setup(['user', 'aauth']);
    expect(await resolve()).toBe('ok');
  });

  it('does not match on a similar name', async () => {
    setup(['auth', 'oauth', 'aauth_ps']);
    expect(await resolve()).toBe('paywall');
  });

  it('reads GET /system once when nothing is cached yet', async () => {
    setup([], ['user', 'aauth']);
    expect(await resolve()).toBe('ok');
    expect(config.fetchSystemData).toHaveBeenCalledTimes(1);
  });

  it('a failed GET /system leaves the page to its own retry state', async () => {
    setup([]);
    config.fetchSystemData.mockReturnValue(throwError(() => ({ status: 500 })));
    expect(await resolve()).toBe('ok');
    expect(errors.error).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  ResolveFn,
} from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { DfPaywallService } from './df-paywall.service';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { DfErrorService } from './df-error.service';
import { dataMaskingResolver } from 'src/app/adf-data-masking/data-masking.resolver';
import { complianceResolver } from 'src/app/adf-compliance/compliance.resolver';

/**
 * Data Masking and Compliance ship in the df-masking package. Without its
 * system resources they behave like every other commercial feature: the
 * shared paywall, whatever the license.
 */
describe('DfPaywallService: Data Masking and Compliance', () => {
  let config: {
    system$: BehaviorSubject<{ resource: { name: string }[] }>;
    environment$: BehaviorSubject<Record<string, unknown>>;
    fetchSystemData: jest.Mock;
    fetchEnvironmentData: jest.Mock;
  };
  let http: { post: jest.Mock };

  function setup(license: string, resources: string[]) {
    const system$ = new BehaviorSubject({
      resource: resources.map(name => ({ name })),
    });
    config = {
      system$,
      environment$: new BehaviorSubject<Record<string, unknown>>({
        platform: { license },
      }),
      fetchSystemData: jest.fn(() => of(system$.value)),
      fetchEnvironmentData: jest.fn(),
    };
    http = { post: jest.fn(() => of({})) };
    TestBed.configureTestingModule({
      providers: [
        DfPaywallService,
        { provide: DfSystemConfigDataService, useValue: config },
        { provide: DfErrorService, useValue: {} },
        { provide: HttpClient, useValue: http },
      ],
    });
    return TestBed.inject(DfPaywallService);
  }

  const resolve = (fn: ResolveFn<'paywall' | 'ok'>) =>
    firstValueFrom(
      TestBed.runInInjectionContext(
        () =>
          fn(
            {} as ActivatedRouteSnapshot,
            {} as RouterStateSnapshot
          ) as Observable<'paywall' | 'ok'>
      )
    );

  afterEach(() => TestBed.resetTestingModule());

  it.each(['OPEN SOURCE', 'SILVER', 'GOLD'])(
    'shows the paywall on %s when the package is absent',
    async license => {
      setup(license, ['user', 'limit']);
      expect(await resolve(dataMaskingResolver)).toBe('paywall');
      expect(await resolve(complianceResolver)).toBe('paywall');
      // The decision itself sends nothing; the paywall component does.
      expect(http.post).not.toHaveBeenCalled();
      expect(config.fetchEnvironmentData).not.toHaveBeenCalled();
    }
  );

  it('opens each page when its own system resource exists', async () => {
    setup('GOLD', ['data_masking', 'security_baseline', 'user']);
    expect(await resolve(dataMaskingResolver)).toBe('ok');
    expect(await resolve(complianceResolver)).toBe('ok');
  });

  it('checks each resource separately', async () => {
    setup('GOLD', ['data_masking']);
    expect(await resolve(dataMaskingResolver)).toBe('ok');
    expect(await resolve(complianceResolver)).toBe('paywall');
  });

  it('locks both features in the nav on open source and silver, not on GOLD', () => {
    const svc = setup('GOLD', []);
    for (const route of ['data-masking', 'compliance']) {
      expect(svc.isFeatureLocked(route, 'OPEN SOURCE')).toBe(true);
      expect(svc.isFeatureLocked(route, 'SILVER')).toBe(true);
      expect(svc.isFeatureLocked(route, 'GOLD')).toBe(false);
    }
  });
});

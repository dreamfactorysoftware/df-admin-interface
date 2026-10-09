import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { trialGuard } from './trial.guard';
import { DfTrialService } from '../services/df-trial.service';
import { ROUTES } from '../types/routes';

describe('trialGuard', () => {
  const trialService = { isLocked: false };
  const router = {
    createUrlTree: jest.fn(
      (commands: string[]) => commands as unknown as UrlTree
    ),
  };

  const run = (routePath: string, url: string) =>
    TestBed.runInInjectionContext(() =>
      trialGuard(
        { routeConfig: { path: routePath } } as ActivatedRouteSnapshot,
        { url } as RouterStateSnapshot
      )
    );

  beforeEach(() => {
    trialService.isLocked = false;
    router.createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: DfTrialService, useValue: trialService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('lets an active trial through everywhere', () => {
    expect(run(ROUTES.HOME, '/home')).toBe(true);
    expect(run(ROUTES.AUTH, '/auth/login')).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects every route to trial-expired while locked (no API call)', () => {
    trialService.isLocked = true;
    expect(run(ROUTES.HOME, '/home')).toEqual([ROUTES.TRIAL_EXPIRED]);
    expect(run(ROUTES.AUTH, '/auth/login')).toEqual([ROUTES.TRIAL_EXPIRED]);
    expect(run(ROUTES.LICENSE_EXPIRED, '/license-expired')).toEqual([
      ROUTES.TRIAL_EXPIRED,
    ]);
  });

  it('allows trial-expired itself while locked', () => {
    trialService.isLocked = true;
    expect(run(ROUTES.TRIAL_EXPIRED, '/trial-expired')).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('sends an active instance away from trial-expired (home)', () => {
    expect(run(ROUTES.TRIAL_EXPIRED, '/trial-expired')).toEqual([ROUTES.HOME]);
  });
});

import { of, BehaviorSubject, Observable } from 'rxjs';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { DfUserDataService } from '../services/df-user-data.service';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ROUTES } from '../types/routes';
import { loggedInGuard } from './logged-in.guard';
import { TestBed, waitForAsync } from '@angular/core/testing';

const MOCK_AUTH_SERVICE = {
  checkSession: jest.fn(() => of(true)),
};

const MOCK_USER_DATA_SERVICE = {
  isLoggedIn$: new BehaviorSubject<boolean>(true),
};

const MOCK_ROUTER = {
  createUrlTree: jest.fn(),
};

// The guard is a CanActivateFn: the router calls it with the route and the
// target state, and the guard reads state.url to build the returnUrl.
const runGuard = (url = '/') =>
  loggedInGuard(
    {} as ActivatedRouteSnapshot,
    { url } as RouterStateSnapshot
  ) as Observable<boolean | UrlTree>;

describe('LoggedInGuard', () => {
  let router: Router;

  beforeEach(waitForAsync(async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DfAuthService,
          useValue: MOCK_AUTH_SERVICE,
        },
        {
          provide: DfUserDataService,
          useValue: MOCK_USER_DATA_SERVICE,
        },
        {
          provide: Router,
          useValue: MOCK_ROUTER,
        },
      ],
    });
    router = TestBed.inject(Router);
  }));

  it('should return true if user is logged in', done => {
    TestBed.runInInjectionContext(() => {
      runGuard().subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  it('should return true if user is not logged in but session is valid', done => {
    TestBed.runInInjectionContext(() => {
      MOCK_USER_DATA_SERVICE.isLoggedIn$.next(false);
      MOCK_AUTH_SERVICE.checkSession.mockReturnValue(of(true));
      runGuard().subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  it('should return a UrlTree to auth route if user is not logged in and session is not valid', done => {
    TestBed.runInInjectionContext(() => {
      MOCK_USER_DATA_SERVICE.isLoggedIn$.next(false);
      MOCK_AUTH_SERVICE.checkSession.mockReturnValue(of(false));
      runGuard().subscribe(() => {
        expect(router.createUrlTree).toHaveBeenCalledWith([ROUTES.AUTH], {
          queryParams: undefined,
        });
        done();
      });
    });
  });

  it('should keep the requested URL as returnUrl when redirecting to the auth route', done => {
    TestBed.runInInjectionContext(() => {
      MOCK_USER_DATA_SERVICE.isLoggedIn$.next(false);
      MOCK_AUTH_SERVICE.checkSession.mockReturnValue(of(false));
      runGuard('/api-connections/api-types/database').subscribe(() => {
        expect(router.createUrlTree).toHaveBeenLastCalledWith([ROUTES.AUTH], {
          queryParams: { returnUrl: '/api-connections/api-types/database' },
        });
        done();
      });
    });
  });
});

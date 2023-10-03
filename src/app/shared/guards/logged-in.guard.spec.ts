import { of, BehaviorSubject } from 'rxjs';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { DfUserDataService } from '../services/df-user-data.service';
import { Router } from '@angular/router';
import { ROUTES } from '../constants/routes';
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
      loggedInGuard().subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  it('should return true if user is not logged in but session is valid', done => {
    TestBed.runInInjectionContext(() => {
      MOCK_USER_DATA_SERVICE.isLoggedIn$.next(false);
      MOCK_AUTH_SERVICE.checkSession.mockReturnValue(of(true));
      loggedInGuard().subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  it('should return a UrlTree to auth route if user is not logged in and session is not valid', done => {
    TestBed.runInInjectionContext(() => {
      MOCK_USER_DATA_SERVICE.isLoggedIn$.next(false);
      MOCK_AUTH_SERVICE.checkSession.mockReturnValue(of(false));
      loggedInGuard().subscribe(() => {
        expect(router.createUrlTree).toHaveBeenCalledWith([ROUTES.AUTH]);
        done();
      });
    });
  });
});

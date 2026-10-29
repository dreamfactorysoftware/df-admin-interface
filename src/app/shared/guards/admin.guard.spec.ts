import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { serverSettingsGuard } from './admin.guard';
import { DfUserDataService } from '../services/df-user-data.service';
import { ROUTES } from '../types/routes';

describe('serverSettingsGuard', () => {
  const userData$ = new BehaviorSubject<unknown>(null);
  const accessibleTabs = jest.fn();
  const router = {
    createUrlTree: jest.fn(
      (commands: string[]) => commands as unknown as UrlTree
    ),
  };

  const run = () =>
    TestBed.runInInjectionContext(() =>
      serverSettingsGuard()
    ) as Observable<unknown>;

  beforeEach(() => {
    userData$.next(null);
    router.createUrlTree.mockClear();
    accessibleTabs.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        { provide: DfUserDataService, useValue: { userData$, accessibleTabs } },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows a full admin', done => {
    userData$.next({ isSysAdmin: true });
    run().subscribe(r => {
      expect(r).toBe(true);
      done();
    });
  });

  it('sends a non-admin Home', done => {
    userData$.next({ isSysAdmin: false });
    run().subscribe(r => {
      expect(r).toEqual([ROUTES.HOME]);
      done();
    });
  });

  it('allows a restricted admin with the config tab', done => {
    accessibleTabs.mockReturnValue(of(['config']));
    userData$.next({ isSysAdmin: true, roleId: 3 });
    run().subscribe(r => {
      expect(r).toBe(true);
      done();
    });
  });

  it('sends a restricted admin without config Home', done => {
    accessibleTabs.mockReturnValue(of(['apps']));
    userData$.next({ isSysAdmin: true, roleId: 3 });
    run().subscribe(r => {
      expect(r).toEqual([ROUTES.HOME]);
      done();
    });
  });

  it('sends a restricted admin Home when the tabs cannot be loaded', done => {
    accessibleTabs.mockReturnValue(throwError(() => new Error('403')));
    userData$.next({ isSysAdmin: true, roleId: 3 });
    run().subscribe(r => {
      expect(r).toEqual([ROUTES.HOME]);
      done();
    });
  });

  it('waits for user data instead of deciding on the initial null', () => {
    const seen: unknown[] = [];
    run().subscribe(r => seen.push(r));
    expect(seen).toEqual([]);
    userData$.next({ isSysAdmin: true });
    expect(seen).toEqual([true]);
  });
});

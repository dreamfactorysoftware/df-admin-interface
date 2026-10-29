import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { sysAdminGuard } from './admin.guard';
import { DfUserDataService } from '../services/df-user-data.service';
import { ROUTES } from '../types/routes';

describe('sysAdminGuard', () => {
  const userData$ = new BehaviorSubject<unknown>(null);
  const router = {
    createUrlTree: jest.fn(
      (commands: string[]) => commands as unknown as UrlTree
    ),
  };

  const run = () =>
    TestBed.runInInjectionContext(() => sysAdminGuard()) as Observable<unknown>;

  beforeEach(() => {
    userData$.next(null);
    router.createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: DfUserDataService, useValue: { userData$ } },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows a sys admin', done => {
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

  it('waits for user data instead of deciding on the initial null', () => {
    const seen: unknown[] = [];
    run().subscribe(r => seen.push(r));
    expect(seen).toEqual([]);
    userData$.next({ isSysAdmin: true });
    expect(seen).toEqual([true]);
  });
});

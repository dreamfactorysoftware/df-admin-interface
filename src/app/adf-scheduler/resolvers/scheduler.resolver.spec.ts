import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import { schedulerResolver } from './scheduler.resolver';

describe('schedulerResolver', () => {
  const task = { id: 15, name: 'nightly' };
  let service: { get: jest.Mock; getAll: jest.Mock };
  let paywalled: boolean;

  const resolve = (id: string | null) =>
    TestBed.runInInjectionContext(() =>
      schedulerResolver(
        { paramMap: { get: () => id } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    ) as Observable<unknown>;

  beforeEach(() => {
    paywalled = false;
    service = {
      get: jest.fn().mockReturnValue(of(task)),
      getAll: jest.fn().mockReturnValue(of({ resource: [task] })),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SCHEDULER_SERVICE_TOKEN, useValue: service },
        {
          provide: DfPaywallService,
          useValue: { activatePaywall: () => of(paywalled) },
        },
      ],
    });
  });

  // Regression: df-scheduler#41 added task_run_by_task_id here. A backend
  // without that relation answers 400 "Unknown relationship" and no task
  // edit page opened.
  it('opens a task with only the relation every df-scheduler has', done => {
    resolve('15').subscribe(result => {
      expect(result).toBe(task);
      expect(service.get).toHaveBeenCalledTimes(1);
      expect(service.get).toHaveBeenCalledWith('15', {
        related: 'task_log_by_task_id',
      });
      done();
    });
  });

  it('never asks the list for run history either', done => {
    resolve(null).subscribe(() => {
      expect(service.getAll).toHaveBeenCalledWith({
        related: 'task_log_by_task_id,service_by_service_id',
      });
      done();
    });
  });

  it('lets a real failure of the task request surface', done => {
    const failure = new Error('boom');
    service.get.mockReturnValue(throwError(() => failure));
    resolve('15').subscribe({
      next: () => done.fail('expected the error to propagate'),
      error: err => {
        expect(err).toBe(failure);
        done();
      },
    });
  });

  it('returns the paywall marker without calling the API', done => {
    paywalled = true;
    resolve('15').subscribe(result => {
      expect(result).toBe('paywall');
      expect(service.get).not.toHaveBeenCalled();
      done();
    });
  });
});

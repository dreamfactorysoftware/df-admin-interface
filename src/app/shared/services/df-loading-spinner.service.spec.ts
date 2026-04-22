import { TestBed } from '@angular/core/testing';
import { DfLoadingSpinnerService } from './df-loading-spinner.service';

describe('DfLoadingSpinnerService', () => {
  let service: DfLoadingSpinnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DfLoadingSpinnerService],
    });

    service = TestBed.inject(DfLoadingSpinnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an inactive spinner', () => {
    service.active.subscribe(active => {
      expect(active).toBeFalsy();
    });
  });

  it('should activate the spinner', () => {
    service.active.subscribe(active => {
      expect(active).toBeTruthy();
    });

    service.active = true;
  });

  it('should deactivate the spinner', () => {
    service.active = true;

    service.active.subscribe(active => {
      expect(active).toBeFalsy();
    });

    service.active = false;
  });

  it('should not allow negative active counter', () => {
    service.active = false;

    service.active.subscribe(active => {
      expect(active).toBeFalsy();
    });

    service.active = false;
  });

  it('settles to inactive when three requests start and finish inside one tick', async () => {
    // Regression for the stuck spinner bug: the previous setTimeout-based
    // implementation compared shouldBeActive to active$.value, which was
    // stale during rapid toggles and lost the final deactivate. After
    // queuedMicrotasks run, the subject must be false.
    const observed: boolean[] = [];
    service.active.subscribe(v => observed.push(v));

    // Simulate three concurrent requests starting and finishing in one tick.
    service.active = true;
    service.active = true;
    service.active = true;
    service.active = false;
    service.active = false;
    service.active = false;

    // Flush all pending microtasks.
    await Promise.resolve();
    await Promise.resolve();

    expect(observed[observed.length - 1]).toBe(false);
  });
});

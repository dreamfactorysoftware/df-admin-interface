import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfLoadingSpinnerService {
  private activeCounter = 0;
  private active$ = new BehaviorSubject<boolean>(false);

  get active(): Observable<boolean> {
    return this.active$.asObservable();
  }

  set active(value: boolean) {
    // Decide on the transition from the counter itself, not from active$.value.
    // Rapid toggles schedule emits via queueMicrotask; during that window
    // active$.value is stale, so comparing against it loses decrements when
    // several requests start and finish inside one tick (spinner stuck on).
    const wasActive = this.activeCounter > 0;
    if (value) {
      this.activeCounter++;
    } else {
      this.activeCounter = Math.max(this.activeCounter - 1, 0);
    }
    const isActive = this.activeCounter > 0;

    if (wasActive !== isActive) {
      // queueMicrotask runs after the current change-detection pass (so no
      // ExpressionChangedAfterItHasBeenCheckedError) but before the next
      // macrotask, which keeps emit ordering consistent with request ordering.
      queueMicrotask(() => {
        if (this.active$.value !== isActive) {
          this.active$.next(isActive);
        }
      });
    }
  }
}

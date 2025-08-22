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
    if (value) {
      this.activeCounter++;
    } else {
      this.activeCounter = Math.max(this.activeCounter - 1, 0);
    }

    const shouldBeActive = this.activeCounter > 0;

    // Only defer if the value is actually changing to avoid unnecessary timeouts
    // This prevents ExpressionChangedAfterItHasBeenCheckedError by ensuring
    // the value change happens after the current change detection cycle completes
    if (this.active$.value !== shouldBeActive) {
      setTimeout(() => {
        this.active$.next(shouldBeActive);
      }, 0);
    }
  }
}

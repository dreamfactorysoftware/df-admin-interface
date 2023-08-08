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
    this.active$.next(value);
  }
}

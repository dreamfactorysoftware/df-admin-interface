import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfSpinnerService {
  private activeSpinnerSubject = new BehaviorSubject<boolean>(false);
  activeSpinner$ = this.activeSpinnerSubject.asObservable();

  show() {
    this.activeSpinnerSubject.next(true);
  }

  hide() {
    this.activeSpinnerSubject.next(false);
  }
}

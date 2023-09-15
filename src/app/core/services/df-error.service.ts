import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfErrorService {
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();
  private hasErrorSubject = new BehaviorSubject<boolean>(false);
  hasError$ = this.hasErrorSubject.asObservable();

  get error(): string | null {
    return this.errorSubject.value;
  }

  set error(error: string | null) {
    this.errorSubject.next(error);
    this.hasError = true;
  }

  get hasError(): boolean {
    return this.hasErrorSubject.value;
  }

  set hasError(hasError: boolean) {
    this.hasErrorSubject.next(hasError);
  }
}

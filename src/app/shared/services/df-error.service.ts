import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { AppError } from '../utilities/app-error';

/**
 * The one error bus, reserved for route-level failures rendered by the
 * /error page (guard rejections, resolver failures with no shell to render
 * into). In-page request failures never land here; they toast or render
 * in-place. Clears on NavigationStart instead of per-request, which was the
 * race that blanked the /error page; navigations that carry their own error
 * in extras.state (e.g. router.navigate(['/error'], { state: { appError } }))
 * are skipped so the state they carry is not wiped before it renders.
 */
@Injectable({
  providedIn: 'root',
})
export class DfErrorService {
  private errorSubject = new BehaviorSubject<AppError | null>(null);
  error$ = this.errorSubject.asObservable();
  private hasErrorSubject = new BehaviorSubject<boolean>(false);
  hasError$ = this.hasErrorSubject.asObservable();

  constructor(router: Router) {
    router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        const state = router.getCurrentNavigation()?.extras?.state;
        if (state && state['appError']) {
          return;
        }
        if (this.errorSubject.value) {
          this.error = null;
        }
      });
  }

  get error(): AppError | null {
    return this.errorSubject.value;
  }

  set error(error: AppError | null) {
    this.errorSubject.next(error);
    this.hasError = !!error;
  }

  set hasError(hasError: boolean) {
    this.hasErrorSubject.next(hasError);
  }
}

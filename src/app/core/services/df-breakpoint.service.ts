import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfBreakpointService {
  constructor(private breakpointObserver: BreakpointObserver) {}

  get isSmallScreen() {
    return this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map(result => result.matches));
  }

  get isXSmallScreen() {
    return this.breakpointObserver
      .observe([Breakpoints.XSmall])
      .pipe(map(result => result.matches));
  }

  //add new observable for other breakpoints as needed
}

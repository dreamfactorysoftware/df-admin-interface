import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfThemeService {
  darkMode$ = new BehaviorSubject<boolean>(false);

  setThemeMode(isDarkMode: boolean) {
    this.darkMode$.next(isDarkMode);
  }
}

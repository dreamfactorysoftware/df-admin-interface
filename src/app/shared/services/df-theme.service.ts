import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfThemeService {
  darkMode$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadInitialTheme();
  }

  setThemeMode(isDarkMode: boolean): void {
    this.darkMode$.next(isDarkMode);
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }

  loadInitialTheme(): void {
    const storedTheme = localStorage.getItem('isDarkMode');
    if (storedTheme) {
      this.darkMode$.next(JSON.parse(storedTheme));
    }
  }
}

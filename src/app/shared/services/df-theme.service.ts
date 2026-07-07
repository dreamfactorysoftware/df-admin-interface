import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfThemeService {
  darkMode$ = new BehaviorSubject<boolean>(false);
  currentTableRowNum$ = new BehaviorSubject<number>(10);

  constructor() {
    this.loadInitialTheme();
  }

  setThemeMode(isDarkMode: boolean): void {
    this.darkMode$.next(isDarkMode);
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    this.applyBodyClass(isDarkMode);
  }

  setCurrentTableRowNum(num: number): void {
    this.currentTableRowNum$.next(num);
  }

  loadInitialTheme(): void {
    const storedTheme = localStorage.getItem('isDarkMode');
    if (storedTheme) {
      this.darkMode$.next(JSON.parse(storedTheme));
    }
    this.applyBodyClass(this.darkMode$.value);
  }

  /** Single source of truth for the theme class: applied once on <body>.
   *  Global styles (styles.scss tokens, dark-style.scss) and component
   *  :host-context(.dark-theme) all key off this. */
  private applyBodyClass(isDarkMode: boolean): void {
    document.body.classList.toggle('dark-theme', isDarkMode);
  }
}

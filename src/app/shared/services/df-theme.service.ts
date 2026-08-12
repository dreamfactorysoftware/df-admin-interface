import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfThemeService {
  darkMode$ = new BehaviorSubject<boolean>(false);
  /** PHOSPHOR: the secret third theme. Implies dark. */
  phosphor$ = new BehaviorSubject<boolean>(false);
  currentTableRowNum$ = new BehaviorSubject<number>(10);

  constructor() {
    this.loadInitialTheme();
  }

  setThemeMode(isDarkMode: boolean): void {
    this.darkMode$.next(isDarkMode);
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    this.applyBodyClass();
  }

  setPhosphorMode(on: boolean): void {
    this.phosphor$.next(on);
    localStorage.setItem('isPhosphor', JSON.stringify(on));
    this.applyBodyClass();
  }

  setCurrentTableRowNum(num: number): void {
    this.currentTableRowNum$.next(num);
  }

  loadInitialTheme(): void {
    const storedTheme = localStorage.getItem('isDarkMode');
    if (storedTheme) {
      this.darkMode$.next(JSON.parse(storedTheme));
    }
    const storedPhosphor = localStorage.getItem('isPhosphor');
    if (storedPhosphor) {
      this.phosphor$.next(JSON.parse(storedPhosphor));
    }
    this.applyBodyClass();
  }

  /** Single source of truth for the theme classes: applied once on <body>.
   *  Global styles (styles.scss tokens, dark-style.scss) and component
   *  :host-context(.dark-theme) all key off this. phosphor stacks on top
   *  of dark so every dark style applies and the tokens repaint it. */
  private applyBodyClass(): void {
    const phosphor = this.phosphor$.value;
    document.body.classList.toggle('phosphor-theme', phosphor);
    document.body.classList.toggle(
      'dark-theme',
      this.darkMode$.value || phosphor
    );
  }
}

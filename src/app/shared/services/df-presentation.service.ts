import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'isPresentationMode';

/**
 * Presentation mode: one switch that masks every API key and session token
 * rendered in the admin UI, for screensharing and demos.
 *
 * Mirrors DfThemeService — BehaviorSubject + localStorage + a single body
 * class, so global styles (and third-party DOM such as Swagger UI, which we
 * cannot template) can key off `.presentation-mode`.
 */
@Injectable({
  providedIn: 'root',
})
export class DfPresentationService {
  on$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadInitial();
  }

  get on(): boolean {
    return this.on$.value;
  }

  set(on: boolean): void {
    this.on$.next(on);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(on));
    this.applyBodyClass();
  }

  toggle(): void {
    this.set(!this.on$.value);
  }

  loadInitial(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.on$.next(JSON.parse(stored) === true);
      } catch {
        /* corrupt value — stay off, which is the safe-for-work default */
      }
    }
    this.applyBodyClass();
  }

  private applyBodyClass(): void {
    document.body.classList.toggle('presentation-mode', this.on$.value);
  }
}

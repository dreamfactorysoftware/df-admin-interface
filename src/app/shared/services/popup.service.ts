import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PopupService {
  private storageKey = 'showPasswordPopup';
  private popupStateSubject = new BehaviorSubject<boolean>(false);
  popupState$ = this.popupStateSubject.asObservable();

  constructor() {
    // Initialize from localStorage
    const savedState = this.shouldShowPopup();
    this.popupStateSubject.next(savedState);
  }

  setShowPopup(value: boolean): void {
    localStorage.setItem(this.storageKey, JSON.stringify(value));
    this.popupStateSubject.next(value);
  }

  shouldShowPopup(): boolean {
    return JSON.parse(localStorage.getItem(this.storageKey) || 'false');
  }
}

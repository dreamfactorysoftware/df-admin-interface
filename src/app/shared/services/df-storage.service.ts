import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DFStorageService {
  isFirstTimeUser$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadInitialConfig();
  }

  setIsFirstUser(): void {
    localStorage.setItem('configFirstTimeUser', JSON.stringify(true));
  }

  loadInitialConfig(): void {
    const configFirstTimeUser = localStorage.getItem('configFirstTimeUser');
    if (configFirstTimeUser) {
      this.isFirstTimeUser$.next(false);
    } else {
      this.isFirstTimeUser$.next(true);
    }
  }
}

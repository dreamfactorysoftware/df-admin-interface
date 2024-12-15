import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const CURRENT_SERVICE_ID_KEY = 'currentServiceId';

@Injectable({
  providedIn: 'root'
})
export class DfCurrentServiceService {
  private currentServiceId: BehaviorSubject<number>;

  constructor() {
    // Initialize with stored value or -1
    const storedId = localStorage.getItem(CURRENT_SERVICE_ID_KEY);
    this.currentServiceId = new BehaviorSubject<number>(storedId ? parseInt(storedId, 10) : -1);
  }

  setCurrentServiceId(id: number) {
    localStorage.setItem(CURRENT_SERVICE_ID_KEY, id.toString());
    this.currentServiceId.next(id);
  }

  getCurrentServiceId(): Observable<number> {
    return this.currentServiceId.asObservable();
  }

  clearCurrentServiceId() {
    localStorage.removeItem(CURRENT_SERVICE_ID_KEY);
    this.currentServiceId.next(-1);
  }
} 
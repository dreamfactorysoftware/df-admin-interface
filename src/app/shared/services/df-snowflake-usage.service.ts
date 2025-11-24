import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SnowflakeUsageInfo {
  limit: number;
  remaining: number;
  reset_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class DfSnowflakeUsageService {
  private usageSubject = new BehaviorSubject<SnowflakeUsageInfo | null>(null);
  public usage$: Observable<SnowflakeUsageInfo | null> =
    this.usageSubject.asObservable();

  updateUsage(usage: SnowflakeUsageInfo) {
    this.usageSubject.next(usage);
  }

  getCurrentUsage(): SnowflakeUsageInfo | null {
    return this.usageSubject.value;
  }
}

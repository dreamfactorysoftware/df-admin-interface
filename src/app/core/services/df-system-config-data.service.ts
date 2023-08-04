import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfSystemConfigDataService {
  private systemConfigData = new BehaviorSubject<SystemConfigData | null>(null);
  systemConfigData$ = this.systemConfigData.asObservable();
  constructor(private http: HttpClient) {}

  fetchSystemConfigData() {
    this.http
      .get<SystemConfigData>('/api/v2/system/environment')
      .subscribe(data => this.systemConfigData.next(data));
  }
}

// interface to be updated if other properties are needed
export interface SystemConfigData {
  authentication: {
    allow_open_registration: boolean;
    open_reg_email_service_id: number;
    allow_forever_sessions: boolean;
    login_attribute: string;
  };
  platform: {
    root_admin_exists: boolean;
  };
}

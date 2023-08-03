import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SystemConfigDataService {
  constructor() {}

  getSystemConfig(): any {
    return {
      authentication: {
        saml: [],
        oauth: [],
        adldap: [],
      },
    };
  }
}

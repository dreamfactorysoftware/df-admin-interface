import { Component } from '@angular/core';
import { SystemConfigDataService } from '../../../services/system-config-data.service';

// TODO: update when necessary
const INSTANCE_URL = { url: '' };

@Component({
  selector: 'df-saml-auth-providers',
  templateUrl: './saml-auth-providers.component.html',
  styleUrls: ['./saml-auth-providers.component.css'],
})
export class SAMLAuthProvidersComponent {
  url: string = INSTANCE_URL.url;
  samls: any[] = [];
  systemConfig: any;

  constructor(private systemConfigDataService: SystemConfigDataService) {
    this.systemConfig = systemConfigDataService.getSystemConfig();

    if (
      this.systemConfig &&
      this.systemConfig.authentication &&
      Object.hasOwn(this.systemConfig.authentication, 'saml')
    ) {
      this.samls = this.systemConfig.authentication.saml;
    }
  }

  samlAuthLogin(providerData: any) {
    window.top!.location.href = this.url + '/' + providerData;
  }

  getIconHref(item: any): string {
    return this.url + '/' + item.value.path;
  }
}

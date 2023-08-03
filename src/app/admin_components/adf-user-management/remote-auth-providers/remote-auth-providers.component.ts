import { Component } from '@angular/core';
import { SystemConfigDataService } from '../../../services/system-config-data.service';

// TODO: update when necessary
const INSTANCE_URL = { url: '' };

@Component({
  selector: 'df-remote-auth-providers',
  templateUrl: './remote-auth-providers.component.html',
  styleUrls: ['./remote-auth-providers.component.css'],
})
export class RemoteAuthProvidersComponent {
  url: string = INSTANCE_URL.url;
  oauths: any[] = [];
  systemConfig: any;

  constructor(private systemConfigDataService: SystemConfigDataService) {
    this.systemConfig = systemConfigDataService.getSystemConfig();

    if (
      this.systemConfig &&
      this.systemConfig.authentication &&
      Object.hasOwn(this.systemConfig.authentication, 'oauth')
    ) {
      this.oauths = this.systemConfig.authentication.oauth;
    }
  }

  remoteAuthLogin(providerData: any) {
    window.top!.location.href = this.url + '/' + providerData;
  }

  getIconHref(item: any): string {
    return this.url + '/' + item.value.path;
  }
}

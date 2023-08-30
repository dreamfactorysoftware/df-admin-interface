import { Component } from '@angular/core';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

import { DfIconCardLinkComponent } from '../df-icon-card-link/df-icon-card-link.component';
import { NgFor, AsyncPipe } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-download-page',
  templateUrl: './df-download-page.component.html',
  styleUrls: ['./df-download-page.component.scss'],
  standalone: true,
  imports: [NgFor, DfIconCardLinkComponent, AsyncPipe, TranslocoPipe],
})
export class DfDownloadPageComponent {
  constructor(public breakpointService: DfBreakpointService) {}

  cloudInstallerLinks = [
    {
      name: 'home.brandNames.oracleCloud',
      url: 'https://bitnami.com/stack/dreamfactory/cloud/oracle',
      icon: 'oraclecloud.png',
    },
    {
      name: 'home.brandNames.bitnami',
      url: 'https://bitnami.com/stack/dreamfactory/cloud',
      icon: 'new_little-bitnami.png',
    },
    {
      name: 'home.brandNames.docker',
      url: 'https://hub.docker.com/r/dreamfactorysoftware/df-docker/',
      icon: 'new_little-docker.png',
    },
    {
      name: 'home.brandNames.amazon',
      url: 'https://bitnami.com/stack/dreamfactory/cloud/aws',
      icon: 'new_little-amazon.png',
    },
    {
      name: 'home.brandNames.azure',
      url: 'https://bitnami.com/stack/dreamfactory/cloud/azure',
      icon: 'new_little-azure.png',
    },
    {
      name: 'home.brandNames.google',
      url: 'https://bitnami.com/stack/dreamfactory/cloud/google',
      icon: 'new_little-google.png',
    },
    {
      name: 'home.brandNames.vmWare',
      url: 'https://bitnami.com/stack/dreamfactory/virtual-machine',
      icon: 'new_little-vmware.png',
    },
  ];

  localInstallerLinks = [
    {
      name: 'home.brandNames.linux',
      url: 'https://bitnami.com/stack/dreamfactory/installer#linux',
      icon: 'linux-64x64.png',
    },
    {
      name: 'home.brandNames.osx',
      url: 'https://bitnami.com/stack/dreamfactory/installer#osx',
      icon: 'apple-64x64v2.png',
    },
    {
      name: 'home.brandNames.windows',
      url: 'https://bitnami.com/stack/dreamfactory/installer#windows',
      icon: 'microsoft-64x64.png',
    },
    {
      name: 'home.brandNames.gitHubSource',
      url: 'https://github.com/dreamfactorysoftware/dreamfactory',
      icon: 'new_little-github.png',
    },
  ];
}

import { Component } from '@angular/core';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

@Component({
  selector: 'df-download-page',
  templateUrl: './df-download-page.component.html',
  styleUrls: ['./df-download-page.component.scss'],
})
export class DfDownloadPageComponent {
  isXSmall: boolean;

  constructor(private breakpointService: DfBreakpointService) {}

  ngOnInit(): void {
    this.breakpointService.isXSmallScreen.subscribe((isXSmall: boolean) => {
      this.isXSmall = isXSmall;
    });
  }

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

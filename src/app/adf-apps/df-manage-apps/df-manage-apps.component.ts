import { Component, ViewChild } from '@angular/core';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { DfManageAppsTableComponent } from './df-manage-apps-table.component';
import { EXPORT_TYPES } from 'src/app/core/constants/supported-extensions';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'df-df-manage-apps',
  templateUrl: './df-manage-apps.component.html',
  styleUrls: ['./df-manage-apps.component.scss'],
})
export class DfManageAppsComponent {
  faUpload = faUpload;
  faDownload = faDownload;
  exportTypes = EXPORT_TYPES;
  @ViewChild(DfManageAppsTableComponent)
  manageAppsTableComponent!: DfManageAppsTableComponent;

  sampleApps = [
    {
      name: 'Android',
      url: 'https://github.com/dreamfactorysoftware/android-sdk',
    },
    {
      name: 'iOS Objective-C',
      url: 'https://github.com/dreamfactorysoftware/ios-sdk',
    },
    {
      name: 'iOS Swift',
      url: 'https://github.com/dreamfactorysoftware/ios-swift-sdk',
    },
    {
      name: 'JavaScript',
      url: 'https://github.com/dreamfactorysoftware/javascript-sdk',
    },
    {
      name: 'AngularJS',
      url: 'https://github.com/dreamfactorysoftware/angular-sdk',
    },
    {
      name: 'Angular 2',
      url: 'https://github.com/dreamfactorysoftware/angular2-sdk',
    },
    { name: 'Ionic', url: 'https://github.com/dreamfactorysoftware/ionic-sdk' },
    {
      name: 'Titanium',
      url: 'https://github.com/dreamfactorysoftware/titanium-sdk',
    },
    {
      name: 'ReactJS',
      url: 'https://github.com/dreamfactorysoftware/reactjs-sdk',
    },
    { name: '.NET', url: 'https://github.com/dreamfactorysoftware/.net-sdk' },
  ];

  openSample = (url: string) => {
    window.open(url, '_blank');
  };
}

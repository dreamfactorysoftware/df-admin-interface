import { Component, ViewChild } from '@angular/core';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { DfManageAppsTableComponent } from './df-manage-apps-table.component';
import { EXPORT_TYPES } from 'src/app/core/constants/supported-extensions';
import { SampleApps } from '../df-apps.consts';

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

  sampleApps = SampleApps;

  openSample = (url: string) => {
    window.open(url, '_blank');
  };
}

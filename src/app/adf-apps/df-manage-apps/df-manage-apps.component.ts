import { Component, ViewChild } from '@angular/core';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import { DfManageAppsTableComponent } from './df-manage-apps-table.component';
import { SampleApps } from '../df-apps.consts';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'df-df-manage-apps',
  templateUrl: './df-manage-apps.component.html',
  styleUrls: ['./df-manage-apps.component.scss'],
})
export class DfManageAppsComponent {
  faFileImport = faFileImport;
  @ViewChild(DfManageAppsTableComponent)
  manageAppsTableComponent!: DfManageAppsTableComponent;

  sampleApps = SampleApps;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  openSample = (url: string) => {
    window.open(url, '_blank');
  };

  gotoImport(): void {
    this.router.navigate(['import'], { relativeTo: this.activatedRoute });
  }
}

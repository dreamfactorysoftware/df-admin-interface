import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ROUTES } from 'src/app/core/constants/routes';

import { MatMenuModule } from '@angular/material/menu';
import { NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { DfManageAppsTableComponent } from './df-manage-apps-table.component';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-df-manage-apps',
  templateUrl: './df-manage-apps.component.html',
  styleUrls: ['./df-manage-apps.component.scss'],
  standalone: true,
  imports: [
    DfManageAppsTableComponent,
    MatButtonModule,
    FontAwesomeModule,
    NgIf,
    MatMenuModule,
    TranslocoPipe,
  ],
})
export class DfManageAppsComponent {
  faUpload = faUpload;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  import() {
    this.router.navigate([ROUTES.IMPORT], {
      relativeTo: this.activatedRoute,
    });
  }
}

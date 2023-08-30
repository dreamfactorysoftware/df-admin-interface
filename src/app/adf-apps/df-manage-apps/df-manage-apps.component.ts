import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-df-manage-apps',
  templateUrl: './df-manage-apps.component.html',
  styleUrls: ['./df-manage-apps.component.scss'],
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

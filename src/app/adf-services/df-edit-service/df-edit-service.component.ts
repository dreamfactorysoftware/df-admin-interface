import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  ServiceType,
  SystemServiceData,
} from '../services/service-data.service';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-df-edit-service',
  templateUrl: './df-edit-service.component.html',
  styleUrls: ['./df-edit-service.component.scss'],
})
export class DfEditServiceComponent {
  destroyer$ = new Subject<void>();

  systemServiceData: SystemServiceData;
  serviceTypeData: ServiceType[];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.data
      .pipe(takeUntil(this.destroyer$))
      .subscribe((response: any) => {
        this.systemServiceData = response.systemServiceData;
        this.serviceTypeData = response.serviceTypeData.resource;
      });
  }

  onButtonClick() {
    this.router.navigate([ROUTES.EDIT_SERVICES]);
  }
}

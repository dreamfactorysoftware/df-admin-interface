import { Component, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { TranslateService } from '@ngx-translate/core';
import {
  ServiceDataService,
  ServiceType,
  SystemServiceData,
} from '../services/service-data.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DFManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { ROUTES } from 'src/app/core/constants/routes';
import { DfManageServicesTableComponent } from '../df-manage-services-table/manage-services-table.component';

export type ServiceTableData = {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  active: boolean;
  deletable: boolean;
};

@Component({
  selector: 'df-manage-services',
  templateUrl: './manage-services.component.html',
  styleUrls: ['./manage-services.component.scss'],
})
export class DfManageServicesComponent {
  destroyed$ = new Subject<void>();

  faTrash = faTrash;
  faCheck = faCheck;

  isDeleteIconVisible: boolean;

  serviceTypes: ServiceType[];
  systemServiceData: SystemServiceData[];
  serviceToEdit: SystemServiceData;

  _router: Router;
  _activatedRoute: ActivatedRoute;

  @ViewChild(DfManageServicesTableComponent)
  manageAdminTableComponent!: DfManageServicesTableComponent;

  constructor(
    private serviceDataService: ServiceDataService,
    activatedRoute: ActivatedRoute,
    router: Router,
    liveAnnouncer: LiveAnnouncer
  ) {
    this._router = router;
    this._activatedRoute = activatedRoute;

    this.serviceDataService
      .getServiceTypes()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(serviceTypes => {
        this.serviceTypes = serviceTypes.resource;
      });

    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.systemServiceData = data.data.resource;
      });
  }
}

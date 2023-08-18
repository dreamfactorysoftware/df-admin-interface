import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import {
  DfServiceFormComponent,
  FormData,
} from '../df-service-form/df-service-form.component';
import {
  ServiceDataService,
  ServiceType,
} from '../services/service-data.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'df-create-service',
  templateUrl: './df-create-service.component.html',
  styleUrls: ['./df-create-service.component.scss'],
})
export class DfCreateServiceComponent implements OnDestroy {
  //TODO: change component name
  destroyer$ = new Subject<void>();
  serviceTypes: ServiceType[];

  isEditServiceMode = false;

  constructor(
    public dialog: MatDialog,
    private service: ServiceDataService,
    activatedRoute: ActivatedRoute
  ) {
    activatedRoute.data
      .pipe(takeUntil(this.destroyer$))
      .subscribe((data: any) => {
        this.serviceTypes = data.data.resource;
      });
  }

  openCreateServiceDialog() {
    const dialogRef = this.dialog.open(DfServiceFormComponent, {
      data: {
        serviceTypes: [...this.serviceTypes],
      },
      disableClose: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroyer$));
  }

  ngOnDestroy() {
    this.destroyer$.next();
    this.destroyer$.complete();
  }
}

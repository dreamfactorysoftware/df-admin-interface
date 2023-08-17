import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { DfServiceFormComponent } from '../df-service-form/df-service-form.component';
import {
  ServiceDataService,
  ServiceType,
} from '../services/service-data.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'df-df-create-service',
  templateUrl: './df-create-service.component.html',
  styleUrls: ['./df-create-service.component.scss'],
})
export class DfCreateServiceComponent implements OnDestroy {
  destroyer$ = new Subject<void>();
  serviceTypes: ServiceType[];

  constructor(
    public dialog: MatDialog,
    service: ServiceDataService,
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

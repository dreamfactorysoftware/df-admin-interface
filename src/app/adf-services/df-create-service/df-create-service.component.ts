import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { DfServiceFormComponent } from '../df-service-form/df-service-form.component';
import { ServiceDataService } from '../services/service-data.service';

@Component({
  selector: 'df-df-create-service',
  templateUrl: './df-create-service.component.html',
  styleUrls: ['./df-create-service.component.scss'],
})
export class DfCreateServiceComponent implements OnDestroy {
  notifier = new Subject<void>();

  constructor(
    public dialog: MatDialog,
    private service: ServiceDataService
  ) {
    this.service.getSystemServiceData();
  }

  openCreateServiceDialog() {
    const dialogRef = this.dialog.open(DfServiceFormComponent, {
      data: {},
      disableClose: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.notifier));
  }

  ngOnDestroy() {
    this.notifier.next();
    this.notifier.complete();
  }
}

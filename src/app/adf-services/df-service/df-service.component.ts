import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DfServiceFormComponent } from '../df-service-form/df-service-form.component';
import { Subject, takeUntil } from 'rxjs';
import { ServiceDataService } from '../services/service-data.service';

@Component({
  selector: 'df-service',
  templateUrl: './df-service.component.html',
  styleUrls: ['./df-service.component.scss'],
})
export class DfServiceComponent implements OnDestroy {
  notifier = new Subject();

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
    this.notifier.next(1);
    this.notifier.complete();
  }
}

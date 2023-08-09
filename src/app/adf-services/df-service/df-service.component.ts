import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DfServiceDialogComponent } from '../df-service-dialog/df-service-dialog.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'df-service',
  templateUrl: './df-service.component.html',
  styleUrls: ['./df-service.component.scss'],
})
export class DfServiceComponent implements OnDestroy {
  notifier = new Subject();

  constructor(public dialog: MatDialog) {}

  openCreateServiceDialog() {
    const dialogRef = this.dialog.open(DfServiceDialogComponent, {
      data: {},
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.notifier))
      .subscribe(result => {
        console.log('The dialog was closed');
      });
  }

  ngOnDestroy() {
    this.notifier.next(1);
    this.notifier.complete();
  }
}

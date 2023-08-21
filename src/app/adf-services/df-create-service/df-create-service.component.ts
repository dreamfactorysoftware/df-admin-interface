import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { DfServiceFormComponent } from '../df-service-form/df-service-form.component';
import { ServiceType } from '../services/service-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-create-service',
  templateUrl: './df-create-service.component.html',
  styleUrls: ['./df-create-service.component.scss'],
})
export class DfCreateServiceComponent implements OnDestroy {
  destroyer$ = new Subject<void>();
  serviceTypes: ServiceType[];

  isEditServiceMode = false;

  constructor(
    public dialog: MatDialog,
    activatedRoute: ActivatedRoute,
    private router: Router
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

  onButtonClick() {
    this.router.navigate([ROUTES.EDIT_SERVICES]);
  }

  ngOnDestroy() {
    this.destroyer$.next();
    this.destroyer$.complete();
  }
}

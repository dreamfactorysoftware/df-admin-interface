import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'df-admin-details',
  templateUrl: './df-admin-details.component.html',
})
export class DfAdminDetailsComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  admin: any;
  constructor(private activatedRoute: ActivatedRoute) {}
  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => {
        this.admin = data;
      });
  }
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

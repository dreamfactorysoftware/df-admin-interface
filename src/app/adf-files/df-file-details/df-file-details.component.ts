import { AsyncPipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';
import { FILE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';

@Component({
  selector: 'df-file-details',
  templateUrl: './df-file-details.component.html',
  styleUrls: ['./df-file-details.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    DfAceEditorComponent,
    TranslocoPipe,
    AsyncPipe,
    FormsModule,
  ],
})
export class DfFileDetailsComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  fileData = '';

  constructor(
    @Inject(FILE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => (this.fileData = data.data));
  }

  ngOnInit(): void {
    console.log('FILE DETAILS');
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  goBack() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute,
    });
  }

  save() {
    console.log('save', this.fileData);
  }
}

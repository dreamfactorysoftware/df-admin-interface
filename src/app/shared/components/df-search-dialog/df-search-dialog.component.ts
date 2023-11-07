import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DfSearchService } from '../../services/df-search.service';
import { DfBreakpointService } from '../../services/df-breakpoint.service';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-search-dialog',
  templateUrl: './df-search-dialog.component.html',
  styleUrls: ['./df-search-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    TranslocoPipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    NgFor,
    RouterModule,
    AsyncPipe,
    NgIf,
    NgTemplateOutlet,
    FontAwesomeModule,
  ],
})
export class DfSearchDialogComponent implements OnInit {
  search = new FormControl();
  results$ = this.searchService.results$;
  recents$ = this.searchService.recents$;
  smallScreen$ = this.breakpointService.isSmallScreen;
  faPlus = faPlus;

  constructor(
    public dialogRef: MatDialogRef<DfSearchDialogComponent>,
    private searchService: DfSearchService,
    private router: Router,
    private breakpointService: DfBreakpointService
  ) {}

  getTranslationKey(path: string) {
    return `nav.${path.replaceAll('/', '.')}.nav`;
  }

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        switchMap(value => this.searchService.search(value))
      )
      .subscribe();
  }

  navigate(path: string) {
    this.router.navigate([path]);
    this.dialogRef.close();
  }
}

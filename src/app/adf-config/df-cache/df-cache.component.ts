import { Component, Inject } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { NgFor } from '@angular/common';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { CACHE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfCacheTableComponent } from './df-cache-table.component';

@Component({
  selector: 'df-cache',
  templateUrl: './df-cache.component.html',
  styleUrls: ['./df-cache.component.scss'],
  standalone: true,
  imports: [
    DfCacheTableComponent,
    TranslocoModule,
    FontAwesomeModule,
    MatButtonModule,
    MatTableModule,
    NgFor,
  ],
})
export class DfCacheComponent {
  faRotate = faRotate;

  constructor(
    @Inject(CACHE_SERVICE_TOKEN)
    private cacheService: DfBaseCrudService
  ) {}

  flushSystemCache() {
    // TODO move text to en.json
    this.cacheService
      .delete('system', { snackbarSuccess: 'System-wide cache flushed.' })
      .subscribe();
  }
}

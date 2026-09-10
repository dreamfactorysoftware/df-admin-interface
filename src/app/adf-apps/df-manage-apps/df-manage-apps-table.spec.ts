import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageAppsTableComponent } from './df-manage-apps-table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  DfAccessUsageService,
  unavailableAccessUsage,
} from 'src/app/shared/services/df-access-usage.service';
import { AccessUsageResult } from 'src/app/shared/types/access-usage';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

describe('DfManageAppsTableComponent', () => {
  let component: DfManageAppsTableComponent;
  let fixture: ComponentFixture<DfManageAppsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageAppsTableComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfManageAppsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('DfManageAppsTableComponent access usage column', () => {
  const setup = (result: AccessUsageResult) => {
    TestBed.configureTestingModule({
      imports: [
        DfManageAppsTableComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        { provide: ActivatedRoute, useValue: { data: of({}) } },
        {
          provide: DfAccessUsageService,
          useValue: { load: jest.fn(() => of(result)) },
        },
        {
          provide: DfSnackbarService,
          useValue: { setSnackbarLastEle: jest.fn() },
        },
      ],
    });
    const fixture = TestBed.createComponent(DfManageAppsTableComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('keeps the existing columns when access usage is unavailable', () => {
    const fixture = setup(unavailableAccessUsage());
    expect(fixture.componentInstance.displayedColumns).toEqual([
      'active',
      'name',
      'role',
      'apiKey',
      'tokens',
      'spend',
      'meter',
      'actions',
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="access-usage-filter"]')
    ).toBeNull();
  });

  it('adds "Last used" ahead of the metering columns when available', () => {
    const fixture = setup({ available: true, rows: new Map(), meta: null });
    const columns = fixture.componentInstance.displayedColumns;
    expect(columns.indexOf('lastUsed')).toBe(columns.indexOf('tokens') - 1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="access-usage-filter"]')
    ).not.toBeNull();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageServiceReportTableComponent } from './df-manage-service-report-table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DfManageServiceReportTableComponent', () => {
  let component: DfManageServiceReportTableComponent;
  let fixture: ComponentFixture<DfManageServiceReportTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageServiceReportTableComponent,
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
    fixture = TestBed.createComponent(DfManageServiceReportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageSchedulerTableComponent } from './df-manage-scheduler-table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DfManageSchedulerTableComponent', () => {
  let component: DfManageSchedulerTableComponent;
  let fixture: ComponentFixture<DfManageSchedulerTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageSchedulerTableComponent,
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
    fixture = TestBed.createComponent(DfManageSchedulerTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

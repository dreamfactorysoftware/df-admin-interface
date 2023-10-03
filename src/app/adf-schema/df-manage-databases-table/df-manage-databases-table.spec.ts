import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageDatabasesTableComponent } from './df-manage-databases-table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DfManageDatabasesTableComponent', () => {
  let component: DfManageDatabasesTableComponent;
  let fixture: ComponentFixture<DfManageDatabasesTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageDatabasesTableComponent,
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
    fixture = TestBed.createComponent(DfManageDatabasesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

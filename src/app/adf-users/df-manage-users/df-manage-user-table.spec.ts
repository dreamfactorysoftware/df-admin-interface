import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageUsersComponent } from './df-manage-users.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DfManageUsersComponent', () => {
  let component: DfManageUsersComponent;
  let fixture: ComponentFixture<DfManageUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageUsersComponent,
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
            data: of({ type: 'reset' }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfManageUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageRolesComponent } from './df-manage-roles.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DfManageRolesComponent', () => {
  let component: DfManageRolesComponent;
  let fixture: ComponentFixture<DfManageRolesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageRolesComponent,
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
    fixture = TestBed.createComponent(DfManageRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

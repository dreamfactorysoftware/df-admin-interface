import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfIconCardLinkComponent } from './df-icon-card-link.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('DfIconCardLinkComponent', () => {
  let component: DfIconCardLinkComponent;
  let fixture: ComponentFixture<DfIconCardLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfIconCardLinkComponent, HttpClientTestingModule],
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
        {
          provide: 'linkInfo',
          useValue: {
            name: 'testName',
            url: 'testUrl',
            icon: 'testIcon',
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfIconCardLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

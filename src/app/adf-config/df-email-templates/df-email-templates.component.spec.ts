import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfEmailTemplatesComponent } from './df-email-templates.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DfEmailTemplatesComponent', () => {
  let component: DfEmailTemplatesComponent;
  let fixture: ComponentFixture<DfEmailTemplatesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfEmailTemplatesComponent,
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
    fixture = TestBed.createComponent(DfEmailTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

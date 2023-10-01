import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfCorsConfigDetailsComponent } from './df-cors-config-details.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DfCorsConfigDetailsComponent', () => {
  let component: DfCorsConfigDetailsComponent;
  let fixture: ComponentFixture<DfCorsConfigDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfCorsConfigDetailsComponent,
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
    fixture = TestBed.createComponent(DfCorsConfigDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

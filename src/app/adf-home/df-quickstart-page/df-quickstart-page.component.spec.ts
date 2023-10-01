import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfQuickstartPageComponent } from './df-quickstart-page.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DfQuickstartPageComponent', () => {
  let component: DfQuickstartPageComponent;
  let fixture: ComponentFixture<DfQuickstartPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfQuickstartPageComponent, HttpClientTestingModule],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
      ],
    });
    fixture = TestBed.createComponent(DfQuickstartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

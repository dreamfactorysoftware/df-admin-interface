import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfWelcomePageComponent } from './df-welcome-page.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('WelcomePageComponent', () => {
  let component: DfWelcomePageComponent;
  let fixture: ComponentFixture<DfWelcomePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfWelcomePageComponent, HttpClientTestingModule],
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
    fixture = TestBed.createComponent(DfWelcomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

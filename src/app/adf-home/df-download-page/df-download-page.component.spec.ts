import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfDownloadPageComponent } from './df-download-page.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DfDownloadPageComponent', () => {
  let component: DfDownloadPageComponent;
  let fixture: ComponentFixture<DfDownloadPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfDownloadPageComponent, HttpClientTestingModule],
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
    fixture = TestBed.createComponent(DfDownloadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

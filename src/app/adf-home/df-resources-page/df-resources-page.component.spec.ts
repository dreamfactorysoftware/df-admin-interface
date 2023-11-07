import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfResourcesPageComponent } from './df-resources-page.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DfResourcesPageComponent', () => {
  let component: DfResourcesPageComponent;
  let fixture: ComponentFixture<DfResourcesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfResourcesPageComponent, HttpClientTestingModule],
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
    fixture = TestBed.createComponent(DfResourcesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfIconLinkComponent } from './df-icon-link.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

const mockLinkItem = {
  name: 'testName',
  icon: ['fas', 'home'] as IconProp,
  link: 'http://test.com',
};

describe('DfIconLinkComponent', () => {
  let component: DfIconLinkComponent;
  let fixture: ComponentFixture<DfIconLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfIconLinkComponent,
        HttpClientTestingModule,
        FontAwesomeModule,
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
      ],
    });
    fixture = TestBed.createComponent(DfIconLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    component.linkItem = mockLinkItem;
    expect(component).toBeTruthy();
  });
});

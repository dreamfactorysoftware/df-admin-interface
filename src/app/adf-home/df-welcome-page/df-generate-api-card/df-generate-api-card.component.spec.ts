import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { provideTransloco } from '@ngneat/transloco';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { DfGenerateApiCardComponent } from './df-generate-api-card.component';

describe('DfGenerateApiCardComponent', () => {
  let component: DfGenerateApiCardComponent;
  let fixture: ComponentFixture<DfGenerateApiCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfGenerateApiCardComponent,
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
      ],
    });

    fixture = TestBed.createComponent(DfGenerateApiCardComponent);
    component = fixture.componentInstance;
    component.icon = faDatabase;
    component.headerText = 'home.welcomePage.apiManagementCard.header';
    component.text = 'home.welcomePage.apiManagementCard.description';
    component.route = '/api-connections';
    component.cardFinalBackgroundColor = '#fff';
    component.cardFinalHeaderColor = '#000';
    fixture.detectChanges();
  });

  it('renders the home tile as an anchor for normal and new-tab navigation', () => {
    const link = fixture.debugElement.query(
      By.css('a.df-generate-api-card-link')
    );

    expect(link).toBeTruthy();
    expect(link.attributes['href']).toBe('/api-connections');
  });
});

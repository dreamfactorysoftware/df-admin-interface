import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { DfSectionLandingComponent } from './df-section-landing.component';

describe('DfSectionLandingComponent', () => {
  let component: DfSectionLandingComponent;
  let fixture: ComponentFixture<DfSectionLandingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfSectionLandingComponent, RouterTestingModule],
    });

    fixture = TestBed.createComponent(DfSectionLandingComponent);
    component = fixture.componentInstance;
    component.eyebrow = 'Gateway';
    component.title = 'Overview';
    component.description = 'Overview page';
    component.groups = [
      {
        title: 'Cards',
        cards: [
          {
            icon: 'api',
            title: 'API Management',
            text: 'Build APIs',
            route: '/api-connections',
            action: 'Open',
          },
        ],
      },
    ];
    fixture.detectChanges();
  });

  it('renders enabled cards as anchors so the whole tile supports new-tab actions', () => {
    const card = fixture.debugElement.query(By.css('a.section-card'));

    expect(card).toBeTruthy();
    expect(card.attributes['href']).toBe('#/api-connections');
  });
});

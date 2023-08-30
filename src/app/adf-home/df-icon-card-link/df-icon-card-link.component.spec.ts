import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfIconCardLinkComponent } from './df-icon-card-link.component';

describe('DfIconCardLinkComponent', () => {
  let component: DfIconCardLinkComponent;
  let fixture: ComponentFixture<DfIconCardLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfIconCardLinkComponent],
    });
    fixture = TestBed.createComponent(DfIconCardLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

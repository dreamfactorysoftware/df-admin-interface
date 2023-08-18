import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceLinksCardComponent } from './df-service-links-card.component';

describe('DfServiceLinksCardComponent', () => {
  let component: DfServiceLinksCardComponent;
  let fixture: ComponentFixture<DfServiceLinksCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceLinksCardComponent],
    });
    fixture = TestBed.createComponent(DfServiceLinksCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

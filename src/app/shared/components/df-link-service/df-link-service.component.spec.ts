import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfLinkServiceComponent } from './df-link-service.component';

describe('DfLinkServiceComponent', () => {
  let component: DfLinkServiceComponent;
  let fixture: ComponentFixture<DfLinkServiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfLinkServiceComponent],
    });
    fixture = TestBed.createComponent(DfLinkServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

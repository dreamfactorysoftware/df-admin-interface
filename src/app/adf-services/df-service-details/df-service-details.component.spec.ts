import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceDetailsComponent } from './df-service-details.component';

describe('DfServiceDetailsComponent', () => {
  let component: DfServiceDetailsComponent;
  let fixture: ComponentFixture<DfServiceDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceDetailsComponent],
    });
    fixture = TestBed.createComponent(DfServiceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageLimitsComponent } from './df-manage-limits.component';

describe('DfManageLimitsComponent', () => {
  let component: DfManageLimitsComponent;
  let fixture: ComponentFixture<DfManageLimitsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfManageLimitsComponent],
    });
    fixture = TestBed.createComponent(DfManageLimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

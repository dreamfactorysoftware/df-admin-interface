import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfLimitComponent } from './df-limit.component';

describe('DfLimitComponent', () => {
  let component: DfLimitComponent;
  let fixture: ComponentFixture<DfLimitComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfLimitComponent],
    });
    fixture = TestBed.createComponent(DfLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

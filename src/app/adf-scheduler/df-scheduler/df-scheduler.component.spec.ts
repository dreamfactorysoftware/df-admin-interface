import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSchedulerComponent } from './df-scheduler.component';

describe('DfSchedulerComponent', () => {
  let component: DfSchedulerComponent;
  let fixture: ComponentFixture<DfSchedulerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfSchedulerComponent]
    });
    fixture = TestBed.createComponent(DfSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

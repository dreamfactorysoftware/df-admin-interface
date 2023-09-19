import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfLogsComponent } from './df-logs.component';

describe('DfLogsComponent', () => {
  let component: DfLogsComponent;
  let fixture: ComponentFixture<DfLogsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfLogsComponent],
    });
    fixture = TestBed.createComponent(DfLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

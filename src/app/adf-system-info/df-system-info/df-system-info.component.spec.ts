import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSystemInfoComponent } from './df-system-info.component';

describe('DfSystemInfoComponent', () => {
  let component: DfSystemInfoComponent;
  let fixture: ComponentFixture<DfSystemInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfSystemInfoComponent],
    });
    fixture = TestBed.createComponent(DfSystemInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

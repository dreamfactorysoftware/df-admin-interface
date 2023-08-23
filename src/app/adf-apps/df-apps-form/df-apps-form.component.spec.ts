import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfCreateAppComponent } from './df-apps-form.component';

describe('DfCreateAppComponent', () => {
  let component: DfCreateAppComponent;
  let fixture: ComponentFixture<DfCreateAppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfCreateAppComponent],
    });
    fixture = TestBed.createComponent(DfCreateAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfCreateServiceComponent } from './df-create-service.component';

describe('DfCreateServiceComponent', () => {
  let component: DfCreateServiceComponent;
  let fixture: ComponentFixture<DfCreateServiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfCreateServiceComponent],
    });
    fixture = TestBed.createComponent(DfCreateServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

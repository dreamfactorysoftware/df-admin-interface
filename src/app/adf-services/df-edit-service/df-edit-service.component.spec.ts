import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfEditServiceComponent } from './df-edit-service.component';

describe('DfEditServiceComponent', () => {
  let component: DfEditServiceComponent;
  let fixture: ComponentFixture<DfEditServiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfEditServiceComponent]
    });
    fixture = TestBed.createComponent(DfEditServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceInfoComponent } from './df-service-info.component';

describe('DfServiceInfoComponent', () => {
  let component: DfServiceInfoComponent;
  let fixture: ComponentFixture<DfServiceInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceInfoComponent],
    });
    fixture = TestBed.createComponent(DfServiceInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

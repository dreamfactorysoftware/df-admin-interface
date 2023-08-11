import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceComponent } from './df-service.component';

describe('DfServiceComponent', () => {
  let component: DfServiceComponent;
  let fixture: ComponentFixture<DfServiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceComponent],
    });
    fixture = TestBed.createComponent(DfServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

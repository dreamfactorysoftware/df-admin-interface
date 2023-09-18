import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfRoleDetailsComponent } from './df-role-details.component';

describe('DfRoleDetailsComponent', () => {
  let component: DfRoleDetailsComponent;
  let fixture: ComponentFixture<DfRoleDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfRoleDetailsComponent],
    });
    fixture = TestBed.createComponent(DfRoleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfCreateRoleComponent } from './df-create-role.component';

describe('DfCreateRoleComponent', () => {
  let component: DfCreateRoleComponent;
  let fixture: ComponentFixture<DfCreateRoleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfCreateRoleComponent]
    });
    fixture = TestBed.createComponent(DfCreateRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

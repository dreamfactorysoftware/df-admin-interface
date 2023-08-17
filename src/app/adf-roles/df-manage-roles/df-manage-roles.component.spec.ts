import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageRolesComponent } from './df-manage-roles.component';

describe('DfManageRolesComponent', () => {
  let component: DfManageRolesComponent;
  let fixture: ComponentFixture<DfManageRolesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfManageRolesComponent]
    });
    fixture = TestBed.createComponent(DfManageRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

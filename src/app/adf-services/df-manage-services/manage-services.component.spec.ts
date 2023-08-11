import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageServicesComponent } from './manage-services.component';

describe('DfManageServicesComponent', () => {
  let component: DfManageServicesComponent;
  let fixture: ComponentFixture<DfManageServicesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfManageServicesComponent],
    });
    fixture = TestBed.createComponent(DfManageServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

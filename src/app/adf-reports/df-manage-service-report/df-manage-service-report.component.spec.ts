import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageServiceReportComponent } from './df-manage-service-report.component';

describe('DfManageServiceReportComponent', () => {
  let component: DfManageServiceReportComponent;
  let fixture: ComponentFixture<DfManageServiceReportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfManageServiceReportComponent]
    });
    fixture = TestBed.createComponent(DfManageServiceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

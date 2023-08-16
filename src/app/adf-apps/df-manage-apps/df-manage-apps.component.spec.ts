import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageAppsComponent } from './df-manage-apps.component';

describe('DfManageAppsComponent', () => {
  let component: DfManageAppsComponent;
  let fixture: ComponentFixture<DfManageAppsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfManageAppsComponent],
    });
    fixture = TestBed.createComponent(DfManageAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

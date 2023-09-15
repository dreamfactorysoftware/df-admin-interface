import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfFilesComponent } from './df-files.component';

describe('DfFilesComponent', () => {
  let component: DfFilesComponent;
  let fixture: ComponentFixture<DfFilesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfFilesComponent],
    });
    fixture = TestBed.createComponent(DfFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

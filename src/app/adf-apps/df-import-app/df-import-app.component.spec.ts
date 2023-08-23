import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfImportAppComponent } from './df-import-app.component';

describe('DfImportAppComponent', () => {
  let component: DfImportAppComponent;
  let fixture: ComponentFixture<DfImportAppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfImportAppComponent],
    });
    fixture = TestBed.createComponent(DfImportAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

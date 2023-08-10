import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfDownloadPageComponent } from './df-download-page.component';

describe('DfDownloadPageComponent', () => {
  let component: DfDownloadPageComponent;
  let fixture: ComponentFixture<DfDownloadPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfDownloadPageComponent]
    });
    fixture = TestBed.createComponent(DfDownloadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

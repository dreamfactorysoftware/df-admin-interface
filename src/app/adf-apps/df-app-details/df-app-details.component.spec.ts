import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfAppDetailsComponent } from './df-app-details.component';

describe('DfAppDetailsComponent', () => {
  let component: DfAppDetailsComponent;
  let fixture: ComponentFixture<DfAppDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfAppDetailsComponent],
    });
    fixture = TestBed.createComponent(DfAppDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

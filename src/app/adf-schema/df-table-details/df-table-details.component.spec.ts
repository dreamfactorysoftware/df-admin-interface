import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfTableDetailsComponent } from './df-table-details.component';

describe('DfTableDetailsComponent', () => {
  let component: DfTableDetailsComponent;
  let fixture: ComponentFixture<DfTableDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfTableDetailsComponent],
    });
    fixture = TestBed.createComponent(DfTableDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

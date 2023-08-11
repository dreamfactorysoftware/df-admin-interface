import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceTableComponent } from './df-service-table.component';

describe('DfServiceTableComponent', () => {
  let component: DfServiceTableComponent;
  let fixture: ComponentFixture<DfServiceTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceTableComponent],
    });
    fixture = TestBed.createComponent(DfServiceTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

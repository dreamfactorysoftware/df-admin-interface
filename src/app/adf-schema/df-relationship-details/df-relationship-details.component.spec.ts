import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfRelationshipDetailsComponent } from './df-relationship-details.component';

describe('DfRelationshipDetailsComponent', () => {
  let component: DfRelationshipDetailsComponent;
  let fixture: ComponentFixture<DfRelationshipDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfRelationshipDetailsComponent],
    });
    fixture = TestBed.createComponent(DfRelationshipDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfCorsConfigDetailsComponent } from './df-cors-config-details.component';

describe('DfCorsConfigDetailsComponent', () => {
  let component: DfCorsConfigDetailsComponent;
  let fixture: ComponentFixture<DfCorsConfigDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfCorsConfigDetailsComponent]
    });
    fixture = TestBed.createComponent(DfCorsConfigDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

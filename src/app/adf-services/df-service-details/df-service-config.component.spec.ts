import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceConfigComponent } from './df-service-config.component';

describe('DfServiceConfigComponent', () => {
  let component: DfServiceConfigComponent;
  let fixture: ComponentFixture<DfServiceConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceConfigComponent],
    });
    fixture = TestBed.createComponent(DfServiceConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceDefinitionComponent } from './df-service-definition.component';

describe('DfServiceConfigComponent', () => {
  let component: DfServiceDefinitionComponent;
  let fixture: ComponentFixture<DfServiceDefinitionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceDefinitionComponent],
    });
    fixture = TestBed.createComponent(DfServiceDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

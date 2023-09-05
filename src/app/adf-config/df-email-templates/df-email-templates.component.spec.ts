import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfEmailTemplatesComponent } from './df-email-templates.component';

describe('DfEmailTemplatesComponent', () => {
  let component: DfEmailTemplatesComponent;
  let fixture: ComponentFixture<DfEmailTemplatesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfEmailTemplatesComponent],
    });
    fixture = TestBed.createComponent(DfEmailTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

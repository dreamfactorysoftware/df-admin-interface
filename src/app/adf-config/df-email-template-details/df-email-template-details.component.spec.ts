import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfEmailTemplateDetailsComponent } from './df-email-template-details.component';

describe('DfEmailTemplateDetailsComponent', () => {
  let component: DfEmailTemplateDetailsComponent;
  let fixture: ComponentFixture<DfEmailTemplateDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfEmailTemplateDetailsComponent],
    });
    fixture = TestBed.createComponent(DfEmailTemplateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

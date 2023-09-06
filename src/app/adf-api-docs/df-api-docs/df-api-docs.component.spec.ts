import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfApiDocsComponent } from './df-api-docs.component';

describe('DfApiDocsComponent', () => {
  let component: DfApiDocsComponent;
  let fixture: ComponentFixture<DfApiDocsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfApiDocsComponent],
    });
    fixture = TestBed.createComponent(DfApiDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

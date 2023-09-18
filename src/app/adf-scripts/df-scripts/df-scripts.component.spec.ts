import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfScriptsComponent } from './df-scripts.component';

describe('DfScriptsComponent', () => {
  let component: DfScriptsComponent;
  let fixture: ComponentFixture<DfScriptsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfScriptsComponent],
    });
    fixture = TestBed.createComponent(DfScriptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

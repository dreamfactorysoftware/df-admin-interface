import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfQuickstartPageComponent } from './df-quickstart-page.component';

describe('DfQuickstartPageComponent', () => {
  let component: DfQuickstartPageComponent;
  let fixture: ComponentFixture<DfQuickstartPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfQuickstartPageComponent],
    });
    fixture = TestBed.createComponent(DfQuickstartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

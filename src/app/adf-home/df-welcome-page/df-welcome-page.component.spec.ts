import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfWelcomePageComponent } from './df-welcome-page.component';

describe('WelcomePageComponent', () => {
  let component: DfWelcomePageComponent;
  let fixture: ComponentFixture<DfWelcomePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfWelcomePageComponent],
    });
    fixture = TestBed.createComponent(DfWelcomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

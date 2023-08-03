import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DFForgotPasswordByEmailComponent } from './df-forgot-pword-email.component';

describe('DFForgotPasswordByEmailComponent', () => {
  let component: DFForgotPasswordByEmailComponent;
  let fixture: ComponentFixture<DFForgotPasswordByEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DFForgotPasswordByEmailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DFForgotPasswordByEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

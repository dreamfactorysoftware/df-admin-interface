import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroupDirective } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DFPasswordResetComponent } from './df-password-reset.component';
import { PasswordResetService } from '../services/df-password-reset.service';

describe('DFPasswordResetComponent', () => {
  let component: DFPasswordResetComponent;
  let fixture: ComponentFixture<DFPasswordResetComponent>;
  let passwordResetService: PasswordResetService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [DFPasswordResetComponent],
      providers: [PasswordResetService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DFPasswordResetComponent);
    component = fixture.componentInstance;
    passwordResetService = TestBed.inject(PasswordResetService);

    // Mock the location path
    // spyOn(component.location, 'path').and.returnValue(
    //   '/reset-password?code=12345'
    // );
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // it('should set the username and email controls to readonly if they have values', () => {
  //   component.passwordResetForm.setValue({
  //     email: 'user@example.com',
  //     username: 'john_doe',
  //     code: '12345',
  //     new_password: '',
  //     confirm_password: '',
  //   });

  //   fixture.detectChanges();

  //   const emailInput = fixture.nativeElement.querySelector(
  //     'input[formControlName="email"]'
  //   );
  //   const usernameInput = fixture.nativeElement.querySelector(
  //     'input[formControlName="username"]'
  //   );

  //   expect(emailInput.readOnly).toBe(true);
  //   expect(usernameInput.readOnly).toBe(true);
  // });

  // it('should set the username and email controls to editable if they do not have values', () => {
  //   component.passwordResetForm.setValue({
  //     email: '',
  //     username: '',
  //     code: '12345',
  //     new_password: '',
  //     confirm_password: '',
  //   });

  //   fixture.detectChanges();

  //   const emailInput = fixture.nativeElement.querySelector(
  //     'input[formControlName="email"]'
  //   );
  //   const usernameInput = fixture.nativeElement.querySelector(
  //     'input[formControlName="username"]'
  //   );

  //   expect(emailInput.readOnly).toBe(false);
  //   expect(usernameInput.readOnly).toBe(false);
  // });

  // Write more test cases for other functionalities of the component
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfRegisterComponent } from './df-register.component';
import { createTestBedConfig } from 'src/app/shared/utilities/test';
import { DfAuthService } from '../services/df-auth.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';

describe('DfRegisterComponent', () => {
  let component: DfRegisterComponent;
  let fixture: ComponentFixture<DfRegisterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfRegisterComponent,
        [DfAuthService, DfSystemConfigDataService],
        {}
      )
    );

    fixture = TestBed.createComponent(DfRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.registerForm.reset();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('user is registered given form input is valid and the register button is clicked', () => {
    const registerSpy = jest.spyOn(DfAuthService.prototype, 'register');

    component.registerForm.controls['profileDetailsGroup'].setValue({
      username: 'test',
      email: 'test@foo.com',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
    });

    component.register();

    expect(registerSpy).toHaveBeenCalled();
  });

  it('user is not registered given form input is invalid and the register button is clicked', () => {
    const registerSpy = jest.spyOn(DfAuthService.prototype, 'register');

    component.registerForm.controls['profileDetailsGroup'].setValue({
      username: 'test',
      email: 'test@foo.com',
      firstName: '',
      lastName: '',
      name: '',
    });

    component.register();

    expect(registerSpy).not.toHaveBeenCalled();
  });
});

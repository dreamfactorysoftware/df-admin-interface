import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { createTestBedConfig } from 'src/app/shared/utilities/test';
import { DfAuthService } from '../services/df-auth.service';
import { DfLoginComponent } from './df-login.component';

describe('DfLoginComponent - email login', () => {
  let component: DfLoginComponent;
  let fixture: ComponentFixture<DfLoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfLoginComponent,
        [
          DfAuthService,
          {
            provide: DfSystemConfigDataService,
            useValue: {
              environment$: {
                pipe: () => {
                  return {
                    subscribe: (fn: (value: any) => void) =>
                      fn({
                        apps: [],
                        authentication: {
                          loginAttribute: 'email',
                          adldap: [],
                          oauth: [],
                          saml: [],
                        },
                        platform: { rootAdminExists: true },
                      }),
                  };
                },
              },
            },
          },
        ],
        {}
      )
    );

    fixture = TestBed.createComponent(DfLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('user login is successful given the form inputs have correct credentials using email and the login button is clicked', () => {
    const loginSpy = jest.spyOn(DfAuthService.prototype, 'login');

    component.loginForm.patchValue({
      email: 'foo@random.com',
      password: 'test',
    });

    component.login();

    expect(loginSpy).toHaveBeenCalled();
  });
  it('user login is unsuccessful given the form inputs have incorrect credentials using email and the login button is clicked', () => {
    const loginSpy = jest.spyOn(DfAuthService.prototype, 'login');

    component.loginForm.patchValue({
      email: 'foo@random.com',
      password: '',
    });

    component.login();

    expect(loginSpy).not.toHaveBeenCalled();
  });
});

describe('DfLoginComponent - username login', () => {
  let component: DfLoginComponent;
  let fixture: ComponentFixture<DfLoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfLoginComponent,
        [
          DfAuthService,
          {
            provide: DfSystemConfigDataService,
            useValue: {
              environment$: {
                pipe: () => {
                  return {
                    subscribe: (fn: (value: any) => void) =>
                      fn({
                        apps: [],
                        authentication: {
                          loginAttribute: 'username',
                          adldap: [
                            {
                              path: 'user/session?service=test-ldap',
                              name: 'test-ldap',
                              label: 'ldap1',
                              verb: 'POST',
                              payload: {
                                username: 'string',
                                password: 'string',
                                service: 'test-ldap',
                                remember_me: 'bool',
                              },
                            },
                          ],
                          oauth: [],
                          saml: [],
                        },
                        platform: { rootAdminExists: true },
                      }),
                  };
                },
              },
            },
          },
        ],
        {}
      )
    );

    fixture = TestBed.createComponent(DfLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('user login is successful given the form inputs have correct credentials using username and the login button is clicked', () => {
    const loginSpy = jest.spyOn(DfAuthService.prototype, 'login');

    component.loginForm.patchValue({
      username: 'jdoe123',
      password: 'test',
    });

    component.login();

    expect(loginSpy).toHaveBeenCalled();
  });

  it('user login is successful given an auth service is selected, the form inputs have correct credentials using username and the login button is clicked', () => {
    const loginSpy = jest.spyOn(DfAuthService.prototype, 'login');

    component.loginForm.patchValue({
      username: 'jdoe123',
      password: 'test',
      services: 'test-ldap',
    });

    component.login();

    expect(loginSpy).toHaveBeenCalled();
  });

  it('user login is unsuccessful given the form inputs have incorrect credentials using username and the login button is clicked', () => {
    const loginSpy = jest.spyOn(DfAuthService.prototype, 'login');

    component.loginForm.patchValue({
      username: 'jdoe123',
      password: '',
    });

    component.login();

    expect(loginSpy).not.toHaveBeenCalled();
  });
});

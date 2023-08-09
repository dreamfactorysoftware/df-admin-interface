import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CaseInterceptor } from './case.interceptor';

describe('CaseInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: CaseInterceptor,
          multi: true,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should convert request body from camel case to snake case', () => {
    const requestBody = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    };

    httpClient.post('/api/users', requestBody).subscribe();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
    });
    req.flush({});
  });

  it('should convert response body from snake case to camel case', () => {
    const responseBody = {
      authentication: {
        admin: {
          path: 'system/admin/session',
          verb: 'POST',
          payload: {
            email: 'string',
            password: 'string',
            remember_me: 'bool',
          },
        },
        user: {
          path: 'user/session',
          verb: 'POST',
          payload: {
            email: 'string',
            password: 'string',
            remember_me: 'bool',
          },
        },
        oauth: [],
        adldap: [],
        saml: [],
        allow_open_registration: true,
        open_reg_email_service_id: 6,
        allow_forever_sessions: false,
        login_attribute: 'username',
      },
      apps: [],
      platform: { root_admin_exists: true },
    };
    httpClient.get('/api/users/123').subscribe(data => {
      expect(data).toEqual({
        authentication: {
          admin: {
            path: 'system/admin/session',
            verb: 'POST',
            payload: {
              email: 'string',
              password: 'string',
              rememberMe: 'bool',
            },
          },
          user: {
            path: 'user/session',
            verb: 'POST',
            payload: {
              email: 'string',
              password: 'string',
              rememberMe: 'bool',
            },
          },
          oauth: [],
          adldap: [],
          saml: [],
          allowOpenRegistration: true,
          openRegEmailServiceId: 6,
          allowForeverSessions: false,
          loginAttribute: 'username',
        },
        apps: [],
        platform: { rootAdminExists: true },
      });
    });

    const req = httpMock.expectOne('/api/users/123');
    expect(req.request.method).toBe('GET');
    req.flush(responseBody);
  });
});

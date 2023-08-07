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
      user_id: 123,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
    };

    httpClient.get('/api/users/123').subscribe(data => {
      expect(data).toEqual({
        userId: 123,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });
    });

    const req = httpMock.expectOne('/api/users/123');
    expect(req.request.method).toBe('GET');
    req.flush(responseBody);
  });
});

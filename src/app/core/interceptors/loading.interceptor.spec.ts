import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { DfLoadingSpinnerService } from '../services/df-loading-spinner.service';
import { LoadingInterceptor } from './loading.interceptor';

describe('LoadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loadingSpinnerService: DfLoadingSpinnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DfLoadingSpinnerService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: LoadingInterceptor,
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loadingSpinnerService = TestBed.inject(DfLoadingSpinnerService);
  });

  it('should add a loading spinner to requests when show-loading header is present', done => {
    const url = 'https://example.com/api/data';
    http.get(url, { headers: { 'show-loading': 'true' } }).subscribe();
    setTimeout(() => {
      loadingSpinnerService.active.subscribe(active => {
        expect(active).toBeTruthy();
        done();
      });
    });
  });

  it('should not add a loading spinner to requests when show-loading header is not present', done => {
    const url = 'https://example.com/api/data';
    http.get(url).subscribe();
    setTimeout(() => {
      loadingSpinnerService.active.subscribe(active => {
        expect(active).toBeFalsy();
        done();
      });
    });
  });
});

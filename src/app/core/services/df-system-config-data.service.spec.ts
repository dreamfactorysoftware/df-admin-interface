import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  DfSystemConfigDataService,
  SystemConfigData,
} from './df-system-config-data.service';

describe('DfSystemConfigDataService', () => {
  let service: DfSystemConfigDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DfSystemConfigDataService],
    });

    service = TestBed.inject(DfSystemConfigDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch system config data', () => {
    const testData: SystemConfigData = {
      authentication: {
        allow_open_registration: true,
        open_reg_email_service_id: 1,
        allow_forever_sessions: false,
        login_attribute: 'email',
      },
      platform: {
        root_admin_exists: true,
      },
    };

    service.fetchSystemConfigData();

    const req = httpMock.expectOne('/api/v2/system/environment');
    expect(req.request.method).toBe('GET');
    req.flush(testData);

    service.systemConfigData$.subscribe(data => {
      expect(data).toEqual(testData);
    });
  });
});

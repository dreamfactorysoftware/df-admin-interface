import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DfServerSettingsService } from './df-server-settings.service';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { URLS } from '../constants/urls';
import { of } from 'rxjs';

describe('DfServerSettingsService', () => {
  let service: DfServerSettingsService;
  let http: HttpTestingController;
  const config = { fetchEnvironmentData: jest.fn(() => of({})) };

  beforeEach(() => {
    config.fetchEnvironmentData.mockClear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: DfSystemConfigDataService, useValue: config }],
    });
    service = TestBed.inject(DfServerSettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll reads the resource list', () => {
    let rows: unknown;
    service.getAll().subscribe(r => (rows = r));
    const req = http.expectOne(URLS.SERVER_SETTING);
    expect(req.request.method).toBe('GET');
    req.flush({ resource: [{ name: 'log_level', source: 'env' }] });
    expect(rows).toEqual([{ name: 'log_level', source: 'env' }]);
  });

  it('update PATCHes the named setting and refreshes the environment', () => {
    service.update('log_level', 'error').subscribe();
    const req = http.expectOne(`${URLS.SERVER_SETTING}/log_level`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ value: 'error' });
    req.flush({ name: 'log_level', value: 'error', source: 'override' });
    expect(config.fetchEnvironmentData).toHaveBeenCalled();
  });

  it('reset DELETEs the named setting and refreshes the environment', () => {
    service.reset('log_level').subscribe();
    const req = http.expectOne(`${URLS.SERVER_SETTING}/log_level`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ name: 'log_level', source: 'env' });
    expect(config.fetchEnvironmentData).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DfBaseCrudService } from './df-base-crud.service';
import { URL_TOKEN } from '../constants/tokens';

describe('DfBaseCrudService list limits', () => {
  let service: DfBaseCrudService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DfBaseCrudService,
        { provide: URL_TOKEN, useValue: '/api/v2/system/service' },
      ],
    });
    service = TestBed.inject(DfBaseCrudService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // Manage tables page client-side over getAll(); a capped default left
  // every page past the cap empty while meta.count reported the full total.
  it('getAll requests every row by default', () => {
    service.getAll().subscribe();
    const req = http.expectOne(r => r.url === '/api/v2/system/service');
    expect(req.request.params.get('limit')).toBe('0');
    expect(req.request.params.get('include_count')).toBe('true');
    req.flush({ resource: [] });
  });

  it('getAll keeps an explicit limit', () => {
    service.getAll({ limit: 25 }).subscribe();
    const req = http.expectOne(r => r.url === '/api/v2/system/service');
    expect(req.request.params.get('limit')).toBe('25');
    req.flush({ resource: [] });
  });

  it('getEventScripts requests every event script', () => {
    service.getEventScripts().subscribe();
    const req = http.expectOne(r => r.url === '/api/v2/system/event_script');
    expect(req.request.params.get('limit')).toBe('0');
    req.flush({ resource: [] });
  });
});

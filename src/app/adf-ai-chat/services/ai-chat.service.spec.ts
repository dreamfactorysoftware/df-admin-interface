import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AiChatService } from './ai-chat.service';

describe('AiChatService', () => {
  let service: AiChatService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiChatService],
    });
    service = TestBed.inject(AiChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listChatServices filters by type=ai_chat', () => {
    service.listChatServices().subscribe();
    const req = http.expectOne(
      r =>
        r.url === '/api/v2/system/service' &&
        r.params.get('filter') === 'type = "ai_chat"'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ resource: [] });
  });

  it('listSessions defaults to status=active', () => {
    service.listSessions('demo').subscribe();
    const req = http.expectOne('/api/v2/demo/session?status=active');
    expect(req.request.method).toBe('GET');
    req.flush({ resource: [] });
  });

  it('listSessions accepts custom status', () => {
    service.listSessions('demo', 'all').subscribe();
    const req = http.expectOne('/api/v2/demo/session?status=all');
    req.flush({ resource: [] });
  });

  it('getSession includes message_limit param', () => {
    service.getSession('demo', 7, 50).subscribe();
    const req = http.expectOne('/api/v2/demo/session/7?message_limit=50');
    expect(req.request.method).toBe('GET');
    req.flush({} as any);
  });

  it('createSession POSTs payload', () => {
    service.createSession('demo', { title: 'Hi' }).subscribe();
    const req = http.expectOne('/api/v2/demo/session');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Hi' });
    req.flush({} as any);
  });

  it('sendMessage POSTs message body to session id', () => {
    service.sendMessage('demo', 9, 'hello').subscribe();
    const req = http.expectOne('/api/v2/demo/session/9');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'hello' });
    req.flush({} as any);
  });

  it('deleteSession DELETEs session by id', () => {
    service.deleteSession('demo', 9).subscribe();
    const req = http.expectOne('/api/v2/demo/session/9');
    expect(req.request.method).toBe('DELETE');
    req.flush({} as any);
  });
});

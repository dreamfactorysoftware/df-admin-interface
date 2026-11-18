import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { DfAiUsageComponent } from './df-ai-usage.component';

const EMPTY_USAGE = { total_requests: 0, by_provider: [] };

/** /ai/usage?service_id=<id> pre-selects that service in the page filter. */
describe('DfAiUsageComponent service_id deep link', () => {
  let fixture: ComponentFixture<DfAiUsageComponent>;
  let http: HttpTestingController;

  function open(query: Record<string, string>, body: unknown = EMPTY_USAGE) {
    TestBed.configureTestingModule({
      imports: [
        DfAiUsageComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
      ],
    });
    fixture = TestBed.createComponent(DfAiUsageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    for (const req of http.match(r => r.url.startsWith('/api/v2/system/'))) {
      req.flush(
        req.request.url.endsWith('/system/service')
          ? {
              resource: [
                { id: 251, name: 'budget', label: 'Budget test', type: 'mcp' },
                { id: 268, name: 'gpu', label: 'GPU demo', type: 'mcp' },
              ],
            }
          : { resource: [] }
      );
    }
    const usage = http.expectOne(r => r.url === '/_internal/ai/usage');
    const mcp = http.expectOne(r => r.url === '/_internal/ai/mcp-usage');
    const sent = {
      usage: usage.request.params.getAll('service_id'),
      mcp: mcp.request.params.getAll('service_id'),
    };
    usage.flush(body as object);
    mcp.flush(body as object);
    fixture.detectChanges();
    return sent;
  }

  afterEach(() => http.verify());

  it('filters the first load by the service in the URL', () => {
    const sent = open({ service_id: '268' });

    expect(sent).toEqual({ usage: ['268'], mcp: ['268'] });
    expect(fixture.componentInstance.filters.service_id).toEqual([268]);
    expect(fixture.componentInstance.activeChips).toEqual([
      { dimension: 'service_id', value: 268, label: 'connection: GPU demo' },
    ]);
    expect(
      fixture.nativeElement.querySelector('.usage__filter-chips').textContent
    ).toContain('connection: GPU demo');
  });

  // Regression: a 200 with an empty or 'null' body (both parse to null)
  // threw in the template, and recomputeViews returned before rebuilding the
  // chips, so the deep-linked filter vanished along with the page body.
  it.each([
    ["'' or 'null' (parsed to null)", null],
    ['an unparsed empty string', ''],
  ])('keeps the deep-linked filter when the body is %s', (_label, body) => {
    let sent: ReturnType<typeof open> | undefined;
    expect(() => (sent = open({ service_id: '268' }, body))).not.toThrow();

    expect(sent).toEqual({ usage: ['268'], mcp: ['268'] });
    expect(fixture.componentInstance.activeChips).toEqual([
      { dimension: 'service_id', value: 268, label: 'connection: GPU demo' },
    ]);
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.usage__filter-chips')?.textContent).toContain(
      'connection: GPU demo'
    );
    expect(page.querySelector('.usage__empty')?.textContent).toContain(
      'No AI requests in this period'
    );
  });

  it.each([
    ['no query string', {}],
    ['a non-numeric id', { service_id: 'abc' }],
    ['a zero id', { service_id: '0' }],
    ['a negative id', { service_id: '-4' }],
    ['an empty id', { service_id: '' }],
  ])('loads unfiltered with %s', (_label, query) => {
    const sent = open(query as Record<string, string>);

    expect(sent).toEqual({ usage: null, mcp: null });
    expect(fixture.componentInstance.filters.service_id).toEqual([]);
    expect(fixture.componentInstance.activeChips).toEqual([]);
  });
});

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  Budget,
  BudgetsService,
  SCOPE_LOAD_LIMIT,
  budgetPayload,
  budgetToForm,
  emptyBudgetForm,
} from './budgets.service';

describe('budgetPayload', () => {
  const form = {
    ...emptyBudgetForm(),
    label: ' Sales ',
    dimension_id: 4,
    budget_usd: 50,
  };

  it('sends no auth header when the field is blank, so PATCH keeps it', () => {
    expect(budgetPayload(form)).not.toHaveProperty('alert_webhook_auth_header');
    expect(budgetPayload(form)).not.toHaveProperty('clear_alert_webhook_auth');
  });

  it('sends a typed auth header', () => {
    const payload = budgetPayload({
      ...form,
      alert_webhook_auth_header: ' Bearer x ',
    });
    expect(payload['alert_webhook_auth_header']).toBe('Bearer x');
  });

  it('clears instead of sending a header when asked to clear', () => {
    const payload = budgetPayload({
      ...form,
      alert_webhook_auth_header: 'Bearer x',
      clear_alert_webhook_auth: true,
    });
    expect(payload['clear_alert_webhook_auth']).toBe(true);
    expect(payload).not.toHaveProperty('alert_webhook_auth_header');
  });

  it('nulls the record id for a global rule', () => {
    const payload = budgetPayload({ ...form, dimension_type: 'global' });
    expect(payload['dimension_id']).toBeNull();
  });

  it('trims the label and sends a blank webhook as null', () => {
    const payload = budgetPayload(form);
    expect(payload['label']).toBe('Sales');
    expect(payload['alert_webhook_url']).toBeNull();
  });

  it('sends no webhook field when the server has alert webhooks off', () => {
    const payload = budgetPayload(
      {
        ...form,
        alert_webhook_url: 'https://example.test/hook',
        alert_webhook_auth_header: 'Bearer x',
        clear_alert_webhook_auth: true,
      },
      false
    );
    expect(payload).not.toHaveProperty('alert_webhook_url');
    expect(payload).not.toHaveProperty('alert_webhook_auth_header');
    expect(payload).not.toHaveProperty('clear_alert_webhook_auth');
    expect(payload['label']).toBe('Sales');
  });
});

describe('budget forms', () => {
  it('starts with hard stop off', () => {
    expect(emptyBudgetForm().hard_stop).toBe(false);
  });

  it('starts an edit with a blank auth header', () => {
    const budget = {
      id: 1,
      label: 'x',
      dimension_type: 'global',
      dimension_id: null,
      period: 'daily',
      budget_usd: 1,
      hard_stop: true,
      alert_webhook_url: null,
      has_alert_webhook_auth: true,
    } as Budget;
    const edit = budgetToForm(budget);
    expect(edit.alert_webhook_auth_header).toBe('');
    expect(edit.has_alert_webhook_auth).toBe(true);
    expect(edit.alert_webhook_url).toBe('');
  });
});

describe('BudgetsService scope lookups', () => {
  let service: BudgetsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BudgetsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for nothing on a global budget', () => {
    let page: unknown;
    service.scopeOptions('global').subscribe(p => (page = p));
    expect(page).toEqual({ items: [], truncated: false });
    let found: unknown;
    service.searchScope('global', 'x').subscribe(f => (found = f));
    expect(found).toEqual([]);
  });

  it('loads one bounded page of roles and reports when there are more', () => {
    let page: { items: unknown[]; truncated: boolean } | undefined;
    service.scopeOptions('role').subscribe(p => (page = p));
    const req = http.expectOne(r => r.url === '/api/v2/system/role');
    expect(req.request.params.get('limit')).toBe(String(SCOPE_LOAD_LIMIT));
    expect(req.request.params.get('include_count')).toBe('true');
    expect(req.request.params.get('sort')).toBe('name');
    expect(req.request.params.has('filter')).toBe(false);
    req.flush({
      resource: [
        { id: 1, name: 'analyst' },
        { id: 2, name: 'sales' },
      ],
      meta: { count: 640 },
    });
    expect(page?.truncated).toBe(true);
    expect(page?.items).toEqual([
      { id: 1, label: 'analyst', keywords: 'analyst' },
      { id: 2, label: 'sales', keywords: 'sales' },
    ]);
  });

  it('is not truncated when the page holds every record', () => {
    let page: { truncated: boolean } | undefined;
    service.scopeOptions('app').subscribe(p => (page = p));
    http
      .expectOne(r => r.url === '/api/v2/system/app')
      .flush({ resource: [{ id: 1, name: 'admin' }], meta: { count: 1 } });
    expect(page?.truncated).toBe(false);
  });

  it('lists only AI connections, by display label with the API name searchable', () => {
    let page: { items: unknown[] } | undefined;
    service.scopeOptions('service').subscribe(p => (page = p));
    const req = http.expectOne(r => r.url === '/api/v2/system/service');
    expect(req.request.params.get('filter')).toBe('type = "ai_connection"');
    req.flush({ resource: [{ id: 3, name: 'gpu', label: 'GPU LLM' }] });
    expect(page?.items).toEqual([{ id: 3, label: 'GPU LLM', keywords: 'gpu' }]);
  });

  it('labels users by name and email', () => {
    let page: { items: { label: string }[] } | undefined;
    service.scopeOptions('user').subscribe(p => (page = p));
    http
      .expectOne(r => r.url === '/api/v2/system/user')
      .flush({ resource: [{ id: 4, name: 'Ana', email: 'ana@example.test' }] });
    expect(page?.items[0].label).toBe('Ana (ana@example.test)');
  });

  it('searches users on the server by name or email', () => {
    service.searchScope('user', 'ana').subscribe();
    const req = http.expectOne(r => r.url === '/api/v2/system/user');
    expect(req.request.params.get('filter')).toBe(
      '(name like "%ana%") or (email like "%ana%")'
    );
    expect(req.request.params.get('limit')).toBe('50');
    req.flush({ resource: [] });
  });

  it('keeps the AI connection filter on a server-side search', () => {
    service.searchScope('service', 'gpu').subscribe();
    const req = http.expectOne(r => r.url === '/api/v2/system/service');
    expect(req.request.params.get('filter')).toBe(
      '(type = "ai_connection") and ((name like "%gpu%") or (label like "%gpu%"))'
    );
    req.flush({ resource: [] });
  });

  it('strips filter syntax out of a search term', () => {
    service.searchScope('role', 'a"%\\b').subscribe();
    const req = http.expectOne(r => r.url === '/api/v2/system/role');
    expect(req.request.params.get('filter')).toBe('(name like "%ab%")');
    req.flush({ resource: [] });
  });
});

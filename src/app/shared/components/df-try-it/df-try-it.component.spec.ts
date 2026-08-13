import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DfTryItComponent } from './df-try-it.component';

// Logic-only suite: exercises the pure request/snippet/scope math without
// rendering (ngOnInit HTTP fires on detectChanges, which we deliberately skip),
// so no transloco runtime provider is required.
describe('DfTryItComponent', () => {
  let component: DfTryItComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfTryItComponent, HttpClientTestingModule],
    }).compileComponents();
    component = TestBed.createComponent(DfTryItComponent).componentInstance;
    component.baseUrl = 'http://localhost/api/v2/mysql';
    component.identities = [
      { id: 'key-abc', label: 'Demo key', type: 'key', apiKey: 'ABC123' },
    ];
    component.selectedIdentityId = 'key-abc';
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('builds the request URL from base + path + enabled params', () => {
    component.path = '/_table/employees';
    component.params = [
      { key: 'limit', value: '5', enabled: true },
      { key: 'skip', value: '1', enabled: false },
    ];
    expect(component.requestUrl).toBe(
      'http://localhost/api/v2/mysql/_table/employees?limit=5'
    );
  });

  it('injects the API-key header for a key identity', () => {
    const headers = component.requestHeaders;
    expect(headers['X-DreamFactory-API-Key']).toBe('ABC123');
  });

  it('generates a curl snippet from the actual request', () => {
    component.method = 'GET';
    component.path = '/_table/employees';
    component.snippetLang = 'curl';
    const snippet = component.snippet;
    expect(snippet).toContain(
      "curl -X GET 'http://localhost/api/v2/mysql/_table/employees'"
    );
    expect(snippet).toContain("-H 'X-DreamFactory-API-Key: ABC123'");
  });

  it('includes the body in POST snippets only', () => {
    component.method = 'POST';
    component.path = '/_table/employees';
    component.body = { resource: [{ name: 'ada' }] };
    component.snippetLang = 'js';
    expect(component.snippet).toContain('JSON.stringify');
    expect(component.snippet).toContain('body:');
  });

  it('maps status codes to the badge variant', () => {
    (component as any).response = { status: 200 };
    expect(component.statusVariant).toBe('success');
    (component as any).response = { status: 403 };
    expect(component.statusVariant).toBe('danger');
    (component as any).response = { status: 404 };
    expect(component.statusVariant).toBe('warning');
  });

  it('derives denied fields by diffing a scoped identity against the session baseline', () => {
    const c = component as any;
    // Session sees the full record set.
    component.identities.unshift({
      id: 'session',
      label: 'Session',
      type: 'session',
    });
    component.selectedIdentityId = 'session';
    c.computeDenied(
      JSON.stringify({ resource: [{ id: 1, name: 'ada', ssn: '123' }] })
    );
    expect(component.deniedFields).toEqual([]);
    // Scoped key sees fewer fields; the difference is denied.
    component.selectedIdentityId = 'key-abc';
    c.computeDenied(JSON.stringify({ resource: [{ id: 1, name: 'ada' }] }));
    expect(component.deniedFields).toEqual(['ssn']);
  });

  it('flags a scoped key 403 as denied, but not a session 403', () => {
    const c = component as any;
    c.response = { status: 403 };
    // Active identity is the key from beforeEach.
    expect(component.isDenied).toBe(true);
    // A 200 under the same key is not a denial.
    c.response = { status: 200 };
    expect(component.isDenied).toBe(false);
    // The admin session is never "denied" in this sense.
    component.identities.unshift({
      id: 'session',
      label: 'Session',
      type: 'session',
    });
    component.selectedIdentityId = 'session';
    c.response = { status: 403 };
    expect(component.isDenied).toBe(false);
  });

  it('names the role (falling back to the key label) in the denial copy', () => {
    component.identities = [
      {
        id: 'k',
        label: 'Reader key',
        type: 'key',
        apiKey: 'K',
        roleName: 'Analyst RO',
      },
    ];
    component.selectedIdentityId = 'k';
    expect(component.deniedIdentityLabel).toBe('Analyst RO');
    component.identities = [
      { id: 'k', label: 'Reader key', type: 'key', apiKey: 'K' },
    ];
    component.selectedIdentityId = 'k';
    expect(component.deniedIdentityLabel).toBe('Reader key');
  });

  it('formats byte sizes', () => {
    expect(component.formatSize(512)).toBe('512 B');
    expect(component.formatSize(2048)).toBe('2.0 KB');
  });
});

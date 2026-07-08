import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DfArtifactCardComponent } from './df-artifact-card.component';
import { API_KEY_HEADER } from 'src/app/shared/constants/http-headers';

describe('DfArtifactCardComponent', () => {
  let component: DfArtifactCardComponent;
  let fixture: ComponentFixture<DfArtifactCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DfArtifactCardComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DfArtifactCardComponent);
    component = fixture.componentInstance;
    component.serviceName = 'db';
    component.baseUrl = 'https://api.example.com/api/v2/db';
    component.sampleTable = 'customers';
    component.apiKey = 'abc123';
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('builds the endpoint URL against a real table with a limit', () => {
    expect(component.endpointUrl).toBe(
      'https://api.example.com/api/v2/db/_table/customers?limit=5'
    );
  });

  it('trims a trailing slash on an explicit base URL', () => {
    component.baseUrl = 'https://api.example.com/api/v2/db/';
    expect(component.resolvedBase).toBe('https://api.example.com/api/v2/db');
  });

  it('embeds the real API key header in the curl snippet', () => {
    expect(component.curlSnippet).toContain(`${API_KEY_HEADER}: abc123`);
    expect(component.curlSnippet).toContain('-X GET');
    expect(component.curlSnippet).toContain('limit=5');
  });

  it('switches the Accept header when the format flips to xml', () => {
    component.format = 'xml';
    expect(component.acceptHeader).toBe('application/xml');
    expect(component.curlSnippet).toContain('Accept: application/xml');
    expect(component.pythonSnippet).toContain('res.text');
    expect(component.javascriptSnippet).toContain('res.text()');
  });

  it('derives the MCP endpoint and emits a valid streamable-http config', () => {
    const parsed = JSON.parse(component.mcpSnippet);
    expect(parsed.mcpServers['dreamfactory-db'].url).toBe(
      'https://api.example.com/api/v2/db/_mcp'
    );
    expect(parsed.mcpServers['dreamfactory-db'].type).toBe('http');
    expect(parsed.mcpServers['dreamfactory-db'].headers[API_KEY_HEADER]).toBe(
      'abc123'
    );
  });

  it('honors an explicit mcpUrl override', () => {
    component.mcpUrl = 'https://gw.example.com/mcp/';
    const parsed = JSON.parse(component.mcpSnippet);
    expect(parsed.mcpServers['dreamfactory-db'].url).toBe(
      'https://gw.example.com/mcp'
    );
  });

  it('falls back to a placeholder and reports no key when apiKey is absent', () => {
    component.apiKey = undefined;
    component.keys = [];
    expect(component.hasKey).toBeFalse();
    expect(component.activeKey).toBe('YOUR_API_KEY');
    expect(component.curlSnippet).toContain('YOUR_API_KEY');
  });

  it('switches the embedded key when a role/key option is selected', () => {
    component.apiKey = undefined;
    component.keys = [
      { label: 'Read-only', apiKey: 'ro-key', role: 'reader' },
      { label: 'Admin', apiKey: 'admin-key', role: 'admin' },
    ];
    expect(component.activeKey).toBe('ro-key');
    component.selectedKey = 'admin-key';
    expect(component.activeKey).toBe('admin-key');
    expect(component.pythonSnippet).toContain('admin-key');
  });

  it('emits the copied block and sets the transient copied state', () => {
    const spy = jasmine.createSpy('copied');
    component.copied.subscribe(spy);
    component.onCopy('curl', component.curlSnippet);
    expect(spy).toHaveBeenCalledWith('curl');
    expect(component.copiedBlock).toBe('curl');
  });
});

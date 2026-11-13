import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Route, provideRouter } from '@angular/router';
import { routes } from 'src/app/routes';
import { DfAiMcpServersComponent } from './df-ai-mcp-servers.component';

/** Follow a URL through the app's route table, one static segment at a
 *  time, and return the routes it passes. */
function matchStatic(url: string): Route[] {
  const matched: Route[] = [];
  let level: Route[] = routes;
  for (const segment of url.split('/').filter(Boolean)) {
    const route = level.find(r => r.path === segment);
    if (!route) {
      return [];
    }
    matched.push(route);
    level = route.children ?? [];
  }
  return matched;
}

describe('DfAiMcpServersComponent', () => {
  let fixture: ComponentFixture<DfAiMcpServersComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfAiMcpServersComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(DfAiMcpServersComponent);
    fixture.componentInstance.form = new FormGroup({
      config: new FormGroup({ mcpServers: new FormControl([]) }),
    });
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http
      .expectOne(r => r.url === '/api/v2/system/service')
      .flush({ resource: [] });
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const createLink = (): HTMLAnchorElement =>
    fixture.nativeElement.querySelector('a.mcp-servers__action');

  // Regression: the link went to /api-connections/api-types/database, the
  // database service list, which cannot create an MCP service.
  it('links "Create MCP service" to the MCP create page', () => {
    expect(createLink().textContent).toContain('Create MCP service');
    expect(createLink().getAttribute('href')).toBe('/ai/mcp/create');
  });

  it('points at a create route that renders the MCP create page', () => {
    const href = createLink().getAttribute('href') ?? '';
    const [, section, create] = matchStatic(href);

    // df-mcp-route-shim renders df-mcp-create only for a create route whose
    // section carries the MCP service group.
    expect(create?.path).toBe('create');
    expect(create?.loadComponent).toBeDefined();
    expect(section?.data?.['groups']).toContain('MCP');
  });
});

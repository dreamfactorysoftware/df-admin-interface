import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { DfAiTestConnectionComponent } from './df-ai-test-connection.component';

function buildForm(config: Record<string, unknown> = {}): FormGroup {
  return new FormGroup({
    config: new FormGroup({
      provider: new FormControl(config['provider'] ?? null),
      api_key: new FormControl(config['api_key'] ?? null),
      base_url: new FormControl(config['base_url'] ?? null),
      organization_id: new FormControl(config['organization_id'] ?? null),
      timeout: new FormControl(config['timeout'] ?? null),
    }),
  });
}

describe('DfAiTestConnectionComponent', () => {
  let fixture: ComponentFixture<DfAiTestConnectionComponent>;
  let component: DfAiTestConnectionComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAiTestConnectionComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
    });
    fixture = TestBed.createComponent(DfAiTestConnectionComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('refuses to test without a provider', () => {
    component.form = buildForm({ provider: null });
    fixture.detectChanges();
    component.run();
    expect(component.result?.success).toBe(false);
    expect(component.result?.error?.message).toMatch(/provider/i);
  });

  it('POSTs config to the internal endpoint', () => {
    component.form = buildForm({
      provider: 'anthropic',
      api_key: 'sk-test',
      base_url: 'https://api.anthropic.com',
    });
    fixture.detectChanges();
    component.run();

    const req = http.expectOne('/_internal/ai/test-connection');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      provider: 'anthropic',
      api_key: 'sk-test',
      base_url: 'https://api.anthropic.com',
    });
    req.flush({ success: true, provider: 'anthropic', resource: [] });
  });

  it('records success result with model count', () => {
    component.form = buildForm({ provider: 'anthropic', api_key: 'k' });
    fixture.detectChanges();
    component.run();
    http.expectOne('/_internal/ai/test-connection').flush({
      success: true,
      provider: 'anthropic',
      resource: [{ id: 'claude-sonnet' }, { id: 'claude-opus' }],
    });
    expect(component.result?.success).toBe(true);
    expect(component.modelCount).toBe(2);
    expect(component.firstModelLabel).toBe('claude-sonnet');
  });

  it('records HTTP error response with message', () => {
    component.form = buildForm({ provider: 'anthropic', api_key: 'bad' });
    fixture.detectChanges();
    component.run();
    http.expectOne('/_internal/ai/test-connection').flush(
      { success: false, error: { message: 'Invalid API key' } },
      { status: 400, statusText: 'Bad Request' }
    );
    expect(component.result?.success).toBe(false);
    expect(component.result?.error?.message).toBe('Invalid API key');
  });

  it('handles plain string model entries', () => {
    component.form = buildForm({ provider: 'ollama' });
    fixture.detectChanges();
    component.run();
    http
      .expectOne('/_internal/ai/test-connection')
      .flush({ success: true, resource: ['llama3', 'mistral'] });
    expect(component.firstModelLabel).toBe('llama3');
  });
});

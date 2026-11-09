import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { of } from 'rxjs';
import { DfDynamicFieldComponent } from 'src/app/shared/components/df-dynamic-field/df-dynamic-field.component';
import {
  CACHE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfAnalyticsService } from 'src/app/shared/services/df-analytics.service';
import { DfPresentationService } from 'src/app/shared/services/df-presentation.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { ConfigSchema, ServiceType } from 'src/app/shared/types/service';
import {
  mapCamelToSnake,
  mapSnakeToCamel,
} from 'src/app/shared/utilities/case';
import {
  BACKEND_AUTH_FIELD_NAMES,
  backendAuthDefaultsToApply,
  backendAuthState,
  missingBackendAuthFields,
  pickBackendAuthFields,
} from './backend-auth-fields';
import { DfServiceDetailsComponent } from './df-service-details.component';

// df-array-field and df-dynamic-field import each other. Jest loads modules
// as CommonJS, so one of the two always sees the other as undefined and the
// service form cannot be compiled. That cycle is why this component had no
// spec. Array and object fields are not under test here: stand in a stub that
// keeps the selector, the schema input and the value accessor, and leave
// df-dynamic-field real.
jest.mock(
  'src/app/shared/components/df-field-array/df-array-field.component',
  () => {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const core = require('@angular/core');
    const forms = require('@angular/forms');
    /* eslint-enable @typescript-eslint/no-var-requires */
    class DfArrayFieldComponent {
      schema: unknown;
      writeValue(): void {
        return;
      }
      registerOnChange(): void {
        return;
      }
      registerOnTouched(): void {
        return;
      }
    }
    core.Input()(DfArrayFieldComponent.prototype, 'schema');
    core.Component({
      selector: 'df-array-field',
      standalone: true,
      template: '',
      providers: [
        {
          provide: forms.NG_VALUE_ACCESSOR,
          useExisting: DfArrayFieldComponent,
          multi: true,
        },
      ],
    })(DfArrayFieldComponent);
    return { DfArrayFieldComponent };
  }
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const servicesEn = require('src/assets/i18n/services/en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootEn = require('src/assets/i18n/en.json');

// ---------------------------------------------------------------------------
// Fixtures. Service types are written in the backend's snake_case shape and
// run through mapSnakeToCamel, which is what the case interceptor does to the
// real /system/service_type response before the component sees it.
// ---------------------------------------------------------------------------

function field(
  name: string,
  type: string,
  label: string,
  extra: Record<string, unknown> = {}
) {
  return {
    alias: null,
    name,
    label,
    description: `${label} description`,
    native: [],
    type,
    length: null,
    precision: null,
    scale: null,
    default: null,
    required: false,
    allow_null: false,
    ...extra,
  };
}

// HTTP service (rws) config schema as the dev stack returns it today.
const RWS_FIELDS = [
  field('base_url', 'text', 'Base URL'),
  field('replace_link', 'boolean', 'Replace Hyperlinks', { default: false }),
  field('implements_access_list', 'boolean', 'Remote Implements Access List', {
    default: false,
  }),
  field('preserve_forward_trailing_slash', 'boolean', 'Trailing slash', {
    default: false,
  }),
  field('options', 'object', 'CURL Options', {
    object: {
      key: { label: 'Name', type: 'string' },
      value: { label: 'Value', type: 'string' },
    },
  }),
  field('parameters', 'array', 'Parameters', {
    items: [field('name', 'string', 'Name'), field('value', 'string', 'Value')],
  }),
  field('headers', 'array', 'Headers', {
    items: [field('name', 'string', 'Name'), field('value', 'string', 'Value')],
  }),
  field('cache_enabled', 'boolean', 'Caching Enabled', { default: false }),
  field('cache_ttl', 'string', 'Cache Time To Live (seconds)', {
    default: '0',
  }),
];

// The six outbound OAuth2 fields from df-rws 635c244 (RwsConfig schema).
const OAUTH_FIELDS = [
  field('oauth_token_url', 'text', 'OAuth2 Token URL', { allow_null: true }),
  field('oauth_client_id', 'text', 'OAuth2 Client ID', { allow_null: true }),
  field('oauth_client_secret', 'password', 'OAuth2 Client Secret', {
    allow_null: true,
  }),
  field('oauth_grant_type', 'picklist', 'OAuth2 Grant Type', {
    allow_null: true,
    default: 'client_credentials',
    values: [{ label: 'Client Credentials', name: 'client_credentials' }],
  }),
  field('oauth_scope', 'text', 'OAuth2 Scope', { allow_null: true }),
  field('oauth_auth_method', 'picklist', 'OAuth2 Client Auth Method', {
    allow_null: true,
    default: 'basic_header',
    values: [
      { label: 'Basic Auth Header (Oracle, default)', name: 'basic_header' },
      { label: 'POST Body (RFC 6749)', name: 'post_body' },
    ],
  }),
];

// The migration puts the OAuth2 columns after preserve_forward_trailing_slash.
const RWS_FIELDS_WITH_OAUTH = [
  ...RWS_FIELDS.slice(0, 4),
  ...OAUTH_FIELDS,
  ...RWS_FIELDS.slice(4),
];

function serviceType(
  name: string,
  group: string,
  configSchema: unknown[]
): ServiceType {
  return mapSnakeToCamel({
    name,
    label: `${name} label`,
    description: '',
    group,
    config_schema: configSchema,
  }) as unknown as ServiceType;
}

const RWS_TYPE = serviceType('rws', 'Remote Service', RWS_FIELDS);
const RWS_TYPE_WITH_OAUTH = serviceType(
  'rws',
  'Remote Service',
  RWS_FIELDS_WITH_OAUTH
);
const SOAP_TYPE = serviceType('soap', 'Remote Service', [
  field('wsdl', 'string', 'WSDL URI'),
  field('options', 'object', 'Options', {
    object: {
      key: { label: 'Name', type: 'string' },
      value: { label: 'Value', type: 'string' },
    },
  }),
  field('cache_enabled', 'boolean', 'Caching Enabled', { default: false }),
]);
// The MCP types carry oauth_client_id and oauth_client_secret for inbound
// OAuth. They are a different feature and must not be picked up.
const MCP_TYPE = serviceType('mcp', 'MCP', [
  field('oauth_client_id', 'string', 'OAuth Client ID'),
  field('oauth_client_secret', 'string', 'OAuth Client Secret'),
  field('auto_oauth_service', 'boolean', 'Auto OAuth service'),
]);
const MYSQL_TYPE = serviceType('mysql', 'Database', [
  field('host', 'string', 'Host'),
  field('port', 'integer', 'Port'),
  field('database', 'string', 'Database'),
  field('username', 'string', 'Username'),
  field('password', 'password', 'Password'),
  field('charset', 'string', 'Character Set'),
]);
const SCRIPT_TYPE = serviceType('nodejs', 'Script', [
  field('content', 'text', 'Content'),
  field('storage_service_id', 'integer', 'Storage service'),
  field('storage_path', 'string', 'Storage path'),
  field('scm_repository', 'string', 'SCM repository'),
  field('scm_reference', 'string', 'SCM reference'),
  field('implements_access_list', 'boolean', 'Implements Access List', {
    default: false,
  }),
]);

const RWS_CONFIG_NO_OAUTH = {
  baseUrl: 'https://api.example.com/v1',
  replaceLink: false,
  implementsAccessList: false,
  preserveForwardTrailingSlash: false,
  options: null,
  parameters: [],
  headers: [],
  cacheEnabled: false,
  cacheTtl: 0,
};

const OAUTH_CONFIG = {
  oauthTokenUrl: 'https://idp.example.com/oauth2/v1/token',
  oauthClientId: 'df-client',
  // What the backend returns for a stored secret (Protectable mask).
  oauthClientSecret: '**********',
  oauthGrantType: 'client_credentials',
  oauthScope: 'urn:opc:resource:consumer::all',
  oauthAuthMethod: 'post_body',
};

function rwsService(config: Record<string, unknown>) {
  return {
    id: 300,
    name: 'remote',
    label: 'Remote',
    description: 'A remote API',
    isActive: true,
    type: 'rws',
    mutable: true,
    deletable: true,
    config,
    serviceDocByServiceId: null,
  };
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

interface SetupOptions {
  group: string;
  serviceTypes: ServiceType[];
  /** Present = edit page for this service record. */
  data?: Record<string, any>;
}

interface Harness {
  fixture: ComponentFixture<DfServiceDetailsComponent>;
  component: DfServiceDetailsComponent;
  el: HTMLElement;
  update: jest.Mock;
  create: jest.Mock;
  openSnackBar: jest.Mock;
}

async function setup(options: SetupOptions): Promise<Harness> {
  const update = jest.fn().mockReturnValue(of({}));
  const create = jest.fn().mockReturnValue(of({ resource: [{ id: 1 }] }));
  const openSnackBar = jest.fn();

  await TestBed.configureTestingModule({
    imports: [
      DfServiceDetailsComponent,
      HttpClientTestingModule,
      NoopAnimationsModule,
      MatSnackBarModule,
      TranslocoTestingModule.forRoot({
        langs: { en: { ...rootEn, services: servicesEn } },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(
              options.data ? { id: String(options.data['id']) } : {}
            ),
            parent: null,
            data: {},
          },
          data: of({
            groups: [options.group],
            serviceTypes: options.serviceTypes,
            data: options.data,
          }),
        },
      },
      {
        provide: Router,
        useValue: { url: '/api-connections/x', navigate: jest.fn() },
      },
      {
        provide: SERVICES_SERVICE_TOKEN,
        useValue: { update, create, getAll: jest.fn(() => of({})) },
      },
      { provide: CACHE_SERVICE_TOKEN, useValue: { delete: jest.fn() } },
      {
        provide: DfSystemConfigDataService,
        useValue: { environment$: of({ platform: { license: 'GOLD' } }) },
      },
      {
        provide: DfAnalyticsService,
        useValue: {
          getDashboardStats: () => of({ services: { total: 3 } }),
        },
      },
      {
        provide: DfSnackbarService,
        useValue: {
          openSnackBar,
          setSnackbarLastEle: jest.fn(),
          setPageLabel: jest.fn(),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DfServiceDetailsComponent);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    el: fixture.nativeElement,
    update,
    create,
    openSnackBar,
  };
}

/** Pick a service type on a create page, the way the type select does. */
function chooseType(h: Harness, type: string): void {
  h.component.serviceForm.controls['type'].setValue(type);
  h.fixture.detectChanges();
}

const PANEL = '[data-testid="backend-auth-panel"]';

function panel(h: Harness): HTMLElement | null {
  return h.el.querySelector(PANEL);
}

function openPanel(h: Harness): void {
  (panel(h)!.querySelector('.disclosure__header') as HTMLButtonElement).click();
  h.fixture.detectChanges();
}

/** Config field names rendered under a host element, in DOM order. */
function renderedFieldNames(h: Harness, within: (el: Element) => boolean) {
  return h.fixture.debugElement
    .queryAll(By.css('df-dynamic-field, df-array-field'))
    .filter(de => within(de.nativeElement))
    .map(de => (de.componentInstance.schema as ConfigSchema).name);
}

/** The df-dynamic-field instance rendering one config field. */
function dynamicField(h: Harness, name: string) {
  const found = h.fixture.debugElement
    .queryAll(By.directive(DfDynamicFieldComponent))
    .find(de => de.componentInstance.schema.name === name);
  if (!found) {
    throw new Error(`df-dynamic-field for ${name} not rendered`);
  }
  return found;
}

function advancedOptions(h: Harness): Element {
  const found = Array.from(h.el.querySelectorAll('mat-expansion-panel')).find(
    p =>
      p
        .querySelector('mat-expansion-panel-header')
        ?.textContent?.includes('Advanced Options')
  );
  if (!found) {
    throw new Error('Advanced Options panel not rendered');
  }
  return found;
}

const inAdvanced = (h: Harness) => {
  const adv = advancedOptions(h);
  return (el: Element) => adv.contains(el);
};
const inPanel = (h: Harness) => (el: Element) => !!el.closest(PANEL);

const OAUTH_NAMES = [...BACKEND_AUTH_FIELD_NAMES];
// What Advanced Options lists for an rws schema on develop: every field but
// the base URL, in schema order.
const RWS_ADVANCED_NAMES = [
  'replaceLink',
  'implementsAccessList',
  'preserveForwardTrailingSlash',
  'options',
  'parameters',
  'headers',
  'cacheEnabled',
  'cacheTtl',
];

function schemaOf(type: ServiceType): ConfigSchema[] {
  return type.configSchema.map(f => ({
    ...f,
    name: f.name.replace(/_(\w)/g, (_, c) => c.toUpperCase()),
  }));
}

// ---------------------------------------------------------------------------
// Pure selection and state rules
// ---------------------------------------------------------------------------

describe('backend-auth-fields', () => {
  const withOauth = schemaOf(RWS_TYPE_WITH_OAUTH);
  const values = (v: Record<string, unknown>) => (name: string) => v[name];

  it('picks the six OAuth2 fields in panel order', () => {
    expect(pickBackendAuthFields(withOauth).map(f => f.name)).toEqual(
      OAUTH_NAMES
    );
  });

  it('keeps panel order when the schema order differs', () => {
    expect(
      pickBackendAuthFields([...withOauth].reverse()).map(f => f.name)
    ).toEqual(OAUTH_NAMES);
  });

  it('returns the schema objects themselves, not copies', () => {
    const picked = pickBackendAuthFields(withOauth);
    picked.forEach(f => expect(withOauth).toContain(f));
  });

  it('picks nothing from a schema without the fields', () => {
    expect(pickBackendAuthFields(schemaOf(RWS_TYPE))).toEqual([]);
    expect(pickBackendAuthFields([])).toEqual([]);
    expect(pickBackendAuthFields(null)).toEqual([]);
    expect(pickBackendAuthFields(undefined)).toEqual([]);
  });

  it('picks nothing from the MCP schema, which has no token URL', () => {
    expect(pickBackendAuthFields(schemaOf(MCP_TYPE))).toEqual([]);
  });

  it.each(['oauthTokenUrl', 'oauthClientId', 'oauthClientSecret'])(
    'picks nothing when core field %s is absent',
    name => {
      expect(
        pickBackendAuthFields(withOauth.filter(f => f.name !== name))
      ).toEqual([]);
    }
  );

  it('still picks the rest when an optional field is absent', () => {
    expect(
      pickBackendAuthFields(withOauth.filter(f => f.name !== 'oauthScope')).map(
        f => f.name
      )
    ).toEqual(OAUTH_NAMES.filter(n => n !== 'oauthScope'));
  });

  it('leaves a field of a type the panel cannot render where it was', () => {
    const odd = withOauth.map(f =>
      f.name === 'oauthScope' ? { ...f, type: 'array' as const } : f
    );
    expect(pickBackendAuthFields(odd).map(f => f.name)).toEqual(
      OAUTH_NAMES.filter(n => n !== 'oauthScope')
    );
    const oddCore = withOauth.map(f =>
      f.name === 'oauthClientId' ? { ...f, type: 'array' as const } : f
    );
    expect(pickBackendAuthFields(oddCore)).toEqual([]);
  });

  describe('state', () => {
    const fields = pickBackendAuthFields(withOauth);

    it('is off without a token URL, whatever else is filled', () => {
      [null, undefined, '', '   '].forEach(oauthTokenUrl => {
        const v = values({ oauthTokenUrl, oauthClientId: 'x' });
        expect(backendAuthState(fields, v)).toBe('off');
        expect(missingBackendAuthFields(fields, v)).toEqual([]);
      });
    });

    it('is on when token URL, client ID, secret and grant type are set', () => {
      const v = values({ ...OAUTH_CONFIG, oauthScope: null });
      expect(backendAuthState(fields, v)).toBe('on');
      expect(missingBackendAuthFields(fields, v)).toEqual([]);
    });

    it('does not need a scope or an auth method', () => {
      const v = values({
        ...OAUTH_CONFIG,
        oauthScope: null,
        oauthAuthMethod: null,
      });
      expect(backendAuthState(fields, v)).toBe('on');
    });

    it('names what is missing once a token URL is set', () => {
      const v = values({ oauthTokenUrl: 'https://idp/token' });
      expect(backendAuthState(fields, v)).toBe('incomplete');
      expect(missingBackendAuthFields(fields, v).map(f => f.name)).toEqual([
        'oauthClientId',
        'oauthClientSecret',
        'oauthGrantType',
      ]);
    });

    it('is off for an empty field list', () => {
      const v = values({ oauthTokenUrl: 'https://idp/token' });
      expect(backendAuthState([], v)).toBe('off');
      expect(missingBackendAuthFields([], v)).toEqual([]);
    });
  });

  describe('defaults', () => {
    const fields = pickBackendAuthFields(withOauth);

    it('offers nothing while the token URL is blank', () => {
      expect(
        backendAuthDefaultsToApply(fields, values({ oauthTokenUrl: '' }))
      ).toEqual([]);
    });

    it('offers the schema default for each empty picklist', () => {
      expect(
        backendAuthDefaultsToApply(
          fields,
          values({ oauthTokenUrl: 'https://idp/token' })
        )
      ).toEqual([
        ['oauthGrantType', 'client_credentials'],
        ['oauthAuthMethod', 'basic_header'],
      ]);
    });

    it('never replaces a value that is already set', () => {
      expect(
        backendAuthDefaultsToApply(
          fields,
          values({
            oauthTokenUrl: 'https://idp/token',
            oauthGrantType: 'client_credentials',
            oauthAuthMethod: 'post_body',
          })
        )
      ).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// The service form
// ---------------------------------------------------------------------------

describe('DfServiceDetailsComponent Backend Authentication panel', () => {
  // The form and df-dynamic-field log on every render and writeValue.
  let log: jest.SpyInstance;
  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterAll(() => log.mockRestore());

  afterEach(() => {
    TestBed.inject(DfPresentationService).set(false);
    localStorage.clear();
  });

  describe('HTTP service whose schema has the OAuth2 fields (create)', () => {
    let h: Harness;

    beforeEach(async () => {
      h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH, SOAP_TYPE],
      });
      chooseType(h, 'rws');
    });

    it('shows the panel, closed, with translated header text', () => {
      const p = panel(h)!;
      expect(p).not.toBeNull();
      expect(p.querySelector('.disclosure__title')?.textContent?.trim()).toBe(
        servicesEn.backendAuth.title
      );
      expect(p.querySelector('.disclosure__eyebrow')?.textContent?.trim()).toBe(
        servicesEn.backendAuth.eyebrow
      );
      expect(p.querySelector('.disclosure__summary')?.textContent?.trim()).toBe(
        servicesEn.backendAuth.summary.off
      );
      expect(
        p.querySelector('.disclosure__header')?.getAttribute('aria-expanded')
      ).toBe('false');
      expect(renderedFieldNames(h, inPanel(h))).toEqual([]);
    });

    it('sits between the base URL and Advanced Options', () => {
      const adv = advancedOptions(h);
      const p = panel(h)!;
      const baseUrl = dynamicField(h, 'baseUrl').nativeElement as Element;
      expect(
        baseUrl.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(
        p.compareDocumentPosition(adv) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it('renders the six fields in the panel once it is open', () => {
      openPanel(h);
      expect(renderedFieldNames(h, inPanel(h))).toEqual(OAUTH_NAMES);
      expect(panel(h)!.textContent).toContain(servicesEn.backendAuth.hint);
      expect(panel(h)!.textContent).toContain(
        servicesEn.backendAuth.description
      );
    });

    it('takes the fields out of Advanced Options and keeps the others', () => {
      expect(renderedFieldNames(h, inAdvanced(h))).toEqual(RWS_ADVANCED_NAMES);
      openPanel(h);
      expect(renderedFieldNames(h, inAdvanced(h))).toEqual(RWS_ADVANCED_NAMES);
    });

    it('renders every schema field exactly once', () => {
      openPanel(h);
      const all = renderedFieldNames(h, () => true).sort();
      expect(all).toEqual(
        schemaOf(RWS_TYPE_WITH_OAUTH)
          .map(f => f.name)
          .sort()
      );
    });

    it('keeps a config control for every field while the panel is closed', () => {
      const config = h.component.serviceForm.getRawValue().config;
      OAUTH_NAMES.forEach(name => expect(config).toHaveProperty(name));
      expect(config.oauthGrantType).toBe('client_credentials');
      expect(config.oauthAuthMethod).toBe('basic_header');
      expect(config.oauthTokenUrl).toBeNull();
    });

    it('offers the grant types and auth methods from the schema', () => {
      openPanel(h);
      const grant = dynamicField(h, 'oauthGrantType');
      expect(grant.nativeElement.querySelector('mat-select')).not.toBeNull();
      expect(
        grant.componentInstance.schema.values.map((v: any) => v.name)
      ).toEqual(['client_credentials']);
      expect(grant.componentInstance.control.value).toBe('client_credentials');
      expect(
        dynamicField(h, 'oauthAuthMethod').componentInstance.schema.values.map(
          (v: any) => v.name
        )
      ).toEqual(['basic_header', 'post_body']);
    });

    it('masks the client secret, and only the secret', () => {
      openPanel(h);
      const input = (name: string) =>
        panel(h)!.querySelector(
          `[data-testid="backend-auth-${name}"] input`
        ) as HTMLInputElement;
      expect(input('oauthClientSecret').type).toBe('password');
      expect(input('oauthClientId').type).toBe('text');
      expect(input('oauthScope').type).toBe('text');
    });

    it('keeps the client secret masked in presentation mode', () => {
      TestBed.inject(DfPresentationService).set(true);
      openPanel(h);
      const secret = panel(h)!.querySelector(
        '[data-testid="backend-auth-oauthClientSecret"]'
      )!;
      expect((secret.querySelector('input') as HTMLInputElement).type).toBe(
        'password'
      );
      // The presentation-mode eye is offered on the secret, not on the ID.
      expect(
        secret.querySelector('[data-testid="config-secret-eye"]')
      ).not.toBeNull();
      expect(
        panel(h)!.querySelector(
          '[data-testid="backend-auth-oauthClientId"] [data-testid="config-secret-eye"]'
        )
      ).toBeNull();
    });

    it('writes what is typed in the panel into the config group', () => {
      openPanel(h);
      const input = panel(h)!.querySelector(
        '[data-testid="backend-auth-oauthClientId"] input'
      ) as HTMLInputElement;
      input.value = 'typed-client';
      input.dispatchEvent(new Event('input'));
      h.fixture.detectChanges();
      expect(h.component.getConfigControl('oauthClientId').value).toBe(
        'typed-client'
      );
    });

    it('reports state in the header and names missing fields', () => {
      openPanel(h);
      const summary = () =>
        panel(h)!.querySelector('.disclosure__summary')?.textContent?.trim();
      const alert = () =>
        panel(h)!.querySelector('[data-testid="backend-auth-incomplete"]');
      expect(alert()).toBeNull();

      h.component.getConfigControl('oauthTokenUrl').setValue('https://idp/t');
      h.fixture.detectChanges();
      expect(summary()).toBe(servicesEn.backendAuth.summary.incomplete);
      expect(alert()?.textContent).toContain(
        'OAuth2 Client ID, OAuth2 Client Secret'
      );
      expect(alert()?.textContent).not.toContain('OAuth2 Grant Type');

      h.component.getConfigControl('oauthClientId').setValue('id');
      h.component.getConfigControl('oauthClientSecret').setValue('s3cret');
      h.fixture.detectChanges();
      expect(summary()).toBe(servicesEn.backendAuth.summary.on);
      expect(alert()).toBeNull();

      h.component.getConfigControl('oauthTokenUrl').setValue('');
      h.fixture.detectChanges();
      expect(summary()).toBe(servicesEn.backendAuth.summary.off);
    });

    it('does not save a half-filled panel, and opens it instead', () => {
      h.component.serviceForm.patchValue({ name: 'remote' });
      h.component.getConfigControl('oauthTokenUrl').setValue('https://idp/t');
      h.component.save(false, false);
      h.fixture.detectChanges();

      expect(h.create).not.toHaveBeenCalled();
      expect(h.openSnackBar).toHaveBeenCalledTimes(1);
      expect(h.openSnackBar.mock.calls[0][0]).toContain('OAuth2 Client ID');
      expect(h.openSnackBar.mock.calls[0][1]).toBe('error');
      expect(
        panel(h)!
          .querySelector('.disclosure__header')
          ?.getAttribute('aria-expanded')
      ).toBe('true');
      expect(renderedFieldNames(h, inPanel(h))).toEqual(OAUTH_NAMES);
    });

    it('saves once the panel is complete, with the backend key names', () => {
      h.component.serviceForm.patchValue({ name: 'remote' });
      h.component.getConfigControl('baseUrl').setValue('https://api.example');
      h.component.getConfigControl('oauthTokenUrl').setValue('https://idp/t');
      h.component.getConfigControl('oauthClientId').setValue('id');
      h.component.getConfigControl('oauthClientSecret').setValue('s3cret');
      h.component.save(false, false);

      expect(h.openSnackBar).not.toHaveBeenCalled();
      expect(h.create).toHaveBeenCalledTimes(1);
      const sent = mapCamelToSnake(h.create.mock.calls[0][0]) as any;
      expect(sent.resource[0].config).toMatchObject({
        base_url: 'https://api.example',
        oauth_token_url: 'https://idp/t',
        oauth_client_id: 'id',
        oauth_client_secret: 's3cret',
        oauth_grant_type: 'client_credentials',
        oauth_scope: null,
        oauth_auth_method: 'basic_header',
      });
    });

    it('saves with the panel never opened and no token URL', () => {
      h.component.serviceForm.patchValue({ name: 'remote' });
      h.component.save(false, false);
      expect(h.create).toHaveBeenCalledTimes(1);
      const sent = mapCamelToSnake(h.create.mock.calls[0][0]) as any;
      expect(sent.resource[0].config.oauth_token_url).toBeNull();
    });

    it('drops the panel when the type changes to one without the fields', () => {
      openPanel(h);
      chooseType(h, 'soap');
      expect(panel(h)).toBeNull();
      expect(renderedFieldNames(h, inAdvanced(h))).toEqual([
        'wsdl',
        'options',
        'cacheEnabled',
      ]);
      chooseType(h, 'rws');
      expect(panel(h)).not.toBeNull();
      // A panel left open on another type starts closed again.
      expect(renderedFieldNames(h, inPanel(h))).toEqual([]);
    });
  });

  describe('memoization', () => {
    it('hands back the same arrays across change detection', async () => {
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH],
      });
      chooseType(h, 'rws');
      openPanel(h);
      const auth = h.component.networkBackendAuthFields;
      const advanced = h.component.networkAdvancedFields;
      const required = h.component.networkRequiredFields;
      expect(auth.length).toBe(6);

      for (let i = 0; i < 5; i++) {
        h.component.getConfigControl('oauthClientId').setValue(`id-${i}`);
        h.fixture.detectChanges();
        expect(h.component.networkBackendAuthFields).toBe(auth);
        expect(h.component.networkAdvancedFields).toBe(advanced);
        expect(h.component.networkRequiredFields).toBe(required);
      }
    });

    it('does not rebuild the panel fields on change detection', async () => {
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH],
      });
      chooseType(h, 'rws');
      openPanel(h);
      const before = Array.from(panel(h)!.querySelectorAll('df-dynamic-field'));
      h.component.getConfigControl('oauthTokenUrl').setValue('https://idp/t');
      h.fixture.detectChanges();
      h.fixture.detectChanges();
      const after = Array.from(panel(h)!.querySelectorAll('df-dynamic-field'));
      expect(after.length).toBe(6);
      after.forEach((node, i) => expect(node).toBe(before[i]));
    });

    it('recomputes when the schema is replaced', async () => {
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH, SOAP_TYPE],
      });
      chooseType(h, 'rws');
      const auth = h.component.networkBackendAuthFields;
      chooseType(h, 'soap');
      expect(h.component.networkBackendAuthFields).toEqual([]);
      chooseType(h, 'rws');
      expect(h.component.networkBackendAuthFields).not.toBe(auth);
      expect(h.component.networkBackendAuthFields.map(f => f.name)).toEqual(
        OAUTH_NAMES
      );
    });
  });

  describe('HTTP service whose schema has the OAuth2 fields (edit)', () => {
    it('loads a configured service and round-trips the same config', async () => {
      const config = { ...RWS_CONFIG_NO_OAUTH, ...OAUTH_CONFIG };
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH],
        data: rwsService({ ...config }),
      });

      expect(
        panel(h)!.querySelector('.disclosure__summary')?.textContent?.trim()
      ).toBe(servicesEn.backendAuth.summary.on);
      openPanel(h);
      expect(
        (
          panel(h)!.querySelector(
            '[data-testid="backend-auth-oauthTokenUrl"] input'
          ) as HTMLInputElement
        ).value
      ).toBe(OAUTH_CONFIG.oauthTokenUrl);

      h.component.save(false, false);
      expect(h.update).toHaveBeenCalledTimes(1);
      const [id, payload] = h.update.mock.calls[0];
      expect(id).toBe(300);
      // Same keys and values as loaded: nothing added, dropped or renamed.
      expect(payload.config).toEqual({ ...config, content: '' });
      const sent = mapCamelToSnake(payload) as any;
      expect(sent.config).toMatchObject({
        oauth_token_url: OAUTH_CONFIG.oauthTokenUrl,
        oauth_client_id: 'df-client',
        // The mask goes back untouched, which the backend reads as "keep".
        oauth_client_secret: '**********',
        oauth_grant_type: 'client_credentials',
        oauth_scope: OAUTH_CONFIG.oauthScope,
        oauth_auth_method: 'post_body',
      });
    });

    it('leaves a service that never used OAuth2 untouched on save', async () => {
      // A service saved before the columns existed: all six load as null.
      const config: Record<string, unknown> = { ...RWS_CONFIG_NO_OAUTH };
      OAUTH_NAMES.forEach(name => (config[name] = null));
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH],
        data: rwsService({ ...config }),
      });
      expect(
        panel(h)!.querySelector('.disclosure__summary')?.textContent?.trim()
      ).toBe(servicesEn.backendAuth.summary.off);

      h.component.save(false, false);
      expect(h.update.mock.calls[0][1].config).toEqual({
        ...config,
        content: '',
      });
    });

    it('fills the empty picklists when a token URL is entered', async () => {
      const config: Record<string, unknown> = { ...RWS_CONFIG_NO_OAUTH };
      OAUTH_NAMES.forEach(name => (config[name] = null));
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH],
        data: rwsService({ ...config }),
      });
      expect(h.component.getConfigControl('oauthGrantType').value).toBeNull();

      h.component.getConfigControl('oauthTokenUrl').setValue('https://idp/t');
      expect(h.component.getConfigControl('oauthGrantType').value).toBe(
        'client_credentials'
      );
      expect(h.component.getConfigControl('oauthAuthMethod').value).toBe(
        'basic_header'
      );
      expect(h.component.getConfigControl('oauthScope').value).toBeNull();
    });

    it('does not replace a stored auth method when the URL changes', async () => {
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH],
        data: rwsService({ ...RWS_CONFIG_NO_OAUTH, ...OAUTH_CONFIG }),
      });
      h.component.getConfigControl('oauthTokenUrl').setValue('https://new/t');
      expect(h.component.getConfigControl('oauthAuthMethod').value).toBe(
        'post_body'
      );
    });
  });

  describe('schemas without the OAuth2 fields', () => {
    it('HTTP service on an older backend: no panel, same field list', async () => {
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE, SOAP_TYPE],
      });
      chooseType(h, 'rws');
      expect(panel(h)).toBeNull();
      expect(h.el.querySelector('df-disclosure')).toBeNull();
      expect(h.component.networkBackendAuthFields).toEqual([]);
      expect(renderedFieldNames(h, inAdvanced(h))).toEqual(RWS_ADVANCED_NAMES);
      expect(renderedFieldNames(h, () => true)).toEqual([
        'baseUrl',
        ...RWS_ADVANCED_NAMES,
      ]);
    });

    it('HTTP service on an older backend: edit saves the loaded config', async () => {
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE],
        data: rwsService({ ...RWS_CONFIG_NO_OAUTH }),
      });
      expect(panel(h)).toBeNull();
      h.component.save(false, false);
      expect(h.openSnackBar).not.toHaveBeenCalled();
      expect(h.update.mock.calls[0][1].config).toEqual({
        ...RWS_CONFIG_NO_OAUTH,
        content: '',
      });
    });

    it('SOAP service: no panel, all fields in Advanced Options', async () => {
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [RWS_TYPE_WITH_OAUTH, SOAP_TYPE],
      });
      chooseType(h, 'soap');
      expect(panel(h)).toBeNull();
      expect(renderedFieldNames(h, () => true)).toEqual([
        'wsdl',
        'options',
        'cacheEnabled',
      ]);
    });

    it('a partial OAuth2 schema is not split out', async () => {
      const partial = serviceType(
        'rws',
        'Remote Service',
        RWS_FIELDS_WITH_OAUTH.filter(f => f.name !== 'oauth_client_secret')
      );
      const h = await setup({
        group: 'Remote Service',
        serviceTypes: [partial],
      });
      chooseType(h, 'rws');
      expect(panel(h)).toBeNull();
      expect(renderedFieldNames(h, inAdvanced(h))).toEqual(
        schemaOf(partial)
          .map(f => f.name)
          .filter(n => n !== 'baseUrl')
      );
    });
  });

  describe('other service groups', () => {
    it('MCP service with oauth_client_id and oauth_client_secret', async () => {
      const h = await setup({ group: 'MCP', serviceTypes: [MCP_TYPE] });
      chooseType(h, 'mcp');
      expect(panel(h)).toBeNull();
      expect(h.component.networkBackendAuthFields).toEqual([]);
      expect(h.component.backendAuthMissingLabels).toBe('');
      expect(renderedFieldNames(h, () => true)).toEqual([
        'oauthClientId',
        'oauthClientSecret',
        'autoOauthService',
      ]);
    });

    it('database service (edit)', async () => {
      const h = await setup({
        group: 'Database',
        serviceTypes: [MYSQL_TYPE],
        data: {
          id: 50,
          name: 'db',
          label: 'DB',
          description: '',
          isActive: true,
          type: 'mysql',
          config: {
            host: 'h',
            port: 3306,
            database: 'd',
            username: 'u',
            password: '**********',
            charset: null,
          },
          serviceDocByServiceId: null,
        },
      });
      expect(panel(h)).toBeNull();
      expect(h.component.networkBackendAuthFields).toEqual([]);
      expect(h.component.networkAdvancedFields).toEqual([]);
      expect(renderedFieldNames(h, () => true)).toEqual([
        'host',
        'port',
        'database',
        'username',
        'password',
        'charset',
      ]);
    });

    it('script service (create)', async () => {
      const h = await setup({ group: 'Script', serviceTypes: [SCRIPT_TYPE] });
      chooseType(h, 'nodejs');
      expect(panel(h)).toBeNull();
      expect(h.component.networkBackendAuthFields).toEqual([]);
      expect(renderedFieldNames(h, () => true)).toEqual([
        'scmRepository',
        'scmReference',
        'implementsAccessList',
      ]);
    });

    it('an OAuth2 schema outside the Remote Service group is not split', async () => {
      const other = serviceType('custom', 'File', RWS_FIELDS_WITH_OAUTH);
      const h = await setup({ group: 'File', serviceTypes: [other] });
      chooseType(h, 'custom');
      expect(panel(h)).toBeNull();
      expect(h.component.networkBackendAuthFields).toEqual([]);
      expect(renderedFieldNames(h, () => true)).toEqual(
        schemaOf(other).map(f => f.name)
      );
    });
  });
});

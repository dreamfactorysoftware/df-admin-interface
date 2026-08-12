import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';

import { DfServiceHealthPanelComponent } from './df-service-health-panel.component';
import {
  DfServiceHealthService,
  ServiceHealthContext,
} from '../df-manage-services/df-service-health.service';

const context = (granted: number[]): ServiceHealthContext => ({
  grantedServiceIds: new Set(granted),
  hasGlobalGrant: false,
});

describe('DfServiceHealthPanelComponent', () => {
  let component: DfServiceHealthPanelComponent;
  let fixture: ComponentFixture<DfServiceHealthPanelComponent>;
  let healthService: DfServiceHealthService;

  const setup = (granted: number[]) => {
    TestBed.configureTestingModule({
      imports: [
        DfServiceHealthPanelComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: DfServiceHealthService,
          useValue: {
            getContext: () => of(context(granted)),
            derive: (row: any, ctx: ServiceHealthContext) =>
              new DfServiceHealthService({} as any).derive(row, ctx),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfServiceHealthPanelComponent);
    component = fixture.componentInstance;
    healthService = TestBed.inject(DfServiceHealthService);
  };

  afterEach(() => TestBed.resetTestingModule());

  it('renders a failing rule with its fix link when no role grants access', () => {
    setup([]);
    component.serviceId = 7;
    component.serviceName = 'mysql-db';
    fixture.detectChanges();

    expect(component.health?.level).toBe('danger');
    expect(component.health?.rules.map(r => r.id)).toEqual(['noAccess']);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.health-panel')).toBeTruthy();
    expect(el.querySelector('.health-panel__fix')).toBeTruthy();
  });

  it('collapses to the compact healthy line when every rule passes', () => {
    setup([7]);
    component.serviceId = 7;
    component.serviceName = 'mysql-db';
    fixture.detectChanges();

    expect(component.health?.level).toBe('success');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.health-panel__ok')).toBeTruthy();
    expect(el.querySelector('.health-panel')).toBeNull();
  });

  it('renders nothing without a service id (the create flow)', () => {
    setup([]);
    fixture.detectChanges();

    expect(component.health).toBeUndefined();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('reports a dead connection as danger with the driver error', () => {
    setup([7]);
    const httpMock = TestBed.inject(HttpTestingController);
    component.serviceId = 7;
    component.serviceName = 'dvdstore';
    component.serviceGroup = 'Database';
    fixture.detectChanges();

    const req = httpMock.expectOne(r => r.url.endsWith('/dvdstore/_schema'));
    // The shape DF actually returns for a bad credential.
    req.flush(
      {
        error: {
          code: 500,
          message:
            "SQLSTATE[28000] [1045] Access denied for user 'dvd'@'172.18.0.1'",
          status_code: 500,
        },
      },
      { status: 500, statusText: 'Internal Server Error' }
    );
    fixture.detectChanges();

    // Governance passes (role 7 is granted) but the service cannot answer, so
    // the panel must not read "healthy".
    expect(component.health?.level).toBe('success');
    expect(component.probe).toBe('failed');
    expect(component.level).toBe('danger');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.health-panel__ok')).toBeNull();
    // Headline stays generic (driver internals are scrubbed out of `message`
    // app-wide); the raw text is reachable through the detail expander.
    expect(el.querySelector('.health-panel__detail')).toBeTruthy();
    expect(el.querySelector('df-error-detail')).toBeTruthy();
    expect(component.probeError?.status).toBe(500);
    expect(JSON.stringify(component.probeError?.raw)).toContain(
      'Access denied for user'
    );
  });

  it('passes when the probe answers', () => {
    setup([7]);
    const httpMock = TestBed.inject(HttpTestingController);
    component.serviceId = 7;
    component.serviceName = 'dvdstore';
    component.serviceGroup = 'Database';
    fixture.detectChanges();

    httpMock
      .expectOne(r => r.url.endsWith('/dvdstore/_schema'))
      .flush('{"resource":[]}');
    fixture.detectChanges();

    expect(component.probe).toBe('ok');
    expect(component.level).toBe('success');
    expect(
      fixture.nativeElement.querySelector('.health-panel__ok')
    ).toBeTruthy();
  });

  it('does not probe a type with no mapped endpoint', () => {
    setup([7]);
    const httpMock = TestBed.inject(HttpTestingController);
    component.serviceId = 7;
    component.serviceName = 'my-script';
    component.serviceGroup = 'Script';
    fixture.detectChanges();

    expect(component.probe).toBe('unsupported');
    // Asserted on the probe URL specifically: transloco pulls its i18n bundle
    // through the same testing backend, so a blanket verify() proves nothing.
    httpMock.expectNone(r => r.url.includes('/my-script'));
  });

  it('re-scores when the service id arrives after first render', () => {
    setup([]);
    fixture.detectChanges();
    expect(component.health).toBeUndefined();

    const spy = jest.spyOn(healthService, 'getContext');
    component.serviceId = 7;
    component.ngOnChanges({ serviceId: {} as any });
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
    expect(component.health?.rules.map(r => r.id)).toEqual(['noAccess']);
  });
});

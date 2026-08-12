import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
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

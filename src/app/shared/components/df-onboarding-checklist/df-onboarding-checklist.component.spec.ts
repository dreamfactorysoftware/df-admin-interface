import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  DfOnboardingChecklistComponent,
  OnboardingStep,
} from './df-onboarding-checklist.component';

describe('DfOnboardingChecklistComponent', () => {
  let component: DfOnboardingChecklistComponent;
  let fixture: ComponentFixture<DfOnboardingChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DfOnboardingChecklistComponent,
        NoopAnimationsModule,
        RouterTestingModule,
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

    fixture = TestBed.createComponent(DfOnboardingChecklistComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('computes five canonical steps from live counts', () => {
    const steps = component.resolvedSteps;
    expect(steps.length).toBe(5);
    expect(steps.map(s => s.key)).toEqual([
      'connectDatasource',
      'generateApi',
      'createApiKey',
      'firstCall',
      'scopeRole',
    ]);
  });

  it('derives done flags from real counts only', () => {
    component.serviceCount = 1;
    component.apiKeyCount = 0;
    const steps = component.resolvedSteps;
    expect(steps[0].done).toBe(true); // connect
    expect(steps[1].done).toBe(true); // generate (connecting builds the API)
    expect(steps[2].done).toBe(false); // key
  });

  it('marks the first incomplete step active and the rest upcoming', () => {
    component.serviceCount = 1; // steps 0,1 done
    expect(component.activeIndex).toBe(2);
    expect(component.stateOf(0, component.resolvedSteps[0])).toBe('done');
    expect(component.stateOf(2, component.resolvedSteps[2])).toBe('active');
    expect(component.stateOf(3, component.resolvedSteps[3])).toBe('upcoming');
  });

  it('reports completion and emits completed once when every step is done', done => {
    component.serviceCount = 1;
    component.apiKeyCount = 1;
    component.roleCount = 1;
    component.firstCallMade = true;
    let emissions = 0;
    component.completed.subscribe(() => (emissions += 1));
    expect(component.allComplete).toBe(true);
    // touch the getter twice; emission must still fire only once
    void component.resolvedSteps;
    void component.resolvedSteps;
    queueMicrotask(() => {
      expect(emissions).toBe(1);
      done();
    });
  });

  it('renders an override array verbatim', () => {
    const custom: OnboardingStep[] = [
      { key: 'a', route: '/x', done: true, title: 'A' },
      { key: 'b', route: '/y', done: false, title: 'B' },
    ];
    component.steps = custom;
    expect(component.resolvedSteps).toBe(custom);
    expect(component.activeIndex).toBe(1);
  });

  it('emits stepCta with the active step on CTA click', () => {
    let emitted: OnboardingStep | undefined;
    component.stepCta.subscribe(s => (emitted = s));
    const step = component.resolvedSteps[0];
    component.onCtaClick(step);
    expect(emitted).toBe(step);
  });
});

import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { DfSystemOverviewComponent } from './df-system-overview.component';
import { SERVICE_TYPE_SERVICE_TOKEN } from '../shared/constants/tokens';
import { DfServerSettingsService } from '../shared/services/df-server-settings.service';
import { DfSystemConfigDataService } from '../shared/services/df-system-config-data.service';

describe('DfSystemOverviewComponent Server Settings card', () => {
  const canOpen$ = new BehaviorSubject(false);
  const environment = { authentication: {}, server: {} };
  let component: DfSystemOverviewComponent;

  const cards = () => component.groups.flatMap(group => group.cards);
  const titles = () => cards().map(card => card.title);

  beforeEach(() => {
    canOpen$.next(false);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SERVICE_TYPE_SERVICE_TOKEN,
          useValue: { getAll: () => of({ resource: [] }) },
        },
        {
          provide: DfSystemConfigDataService,
          useValue: { environment, environment$: of(environment) },
        },
        { provide: DfServerSettingsService, useValue: { canOpen$ } },
      ],
    });
    component = TestBed.runInInjectionContext(
      () => new DfSystemOverviewComponent()
    );
    component.ngOnInit();
  });

  it('has no Server Settings card when it cannot be opened (old backend or no access)', () => {
    expect(titles()).not.toContain('Server Settings');
    expect(titles()).toContain('System Info');
    expect(titles()).toContain('Cache');
  });

  it('adds the card, right after System Info, once it can be opened', () => {
    const before = titles();
    canOpen$.next(true);

    expect(titles()).toContain('Server Settings');
    expect(titles().filter(title => title !== 'Server Settings')).toEqual(
      before
    );
    expect(titles().indexOf('Server Settings')).toBe(
      titles().indexOf('System Info') + 1
    );
    expect(cards().find(card => card.title === 'Server Settings')?.route).toBe(
      '/system-settings/config/server-settings'
    );
  });

  it('removes the card again when access goes away', () => {
    canOpen$.next(true);
    canOpen$.next(false);
    expect(titles()).not.toContain('Server Settings');
  });

  it('keeps the cards array stable between changes', () => {
    const first = component.groups;
    expect(component.groups).toBe(first);
    canOpen$.next(true);
    const second = component.groups;
    expect(second).not.toBe(first);
    expect(component.groups).toBe(second);
  });
});

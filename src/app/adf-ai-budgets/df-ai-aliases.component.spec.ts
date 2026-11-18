import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { PickerItem } from 'src/app/shared/components/df-picker-list/df-picker-list.component';
import { AiBudgetsAvailabilityService } from './ai-budgets-availability.service';
import { BudgetsService, ModelAlias } from './budgets.service';
import {
  ALIAS_PAGE_SIZE,
  DfAiAliasesComponent,
} from './df-ai-aliases.component';

// Real copy, so a missing translation key fails the spec.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: Translation = require('../../assets/i18n/en.json');

@Injectable()
class InlineLoader implements TranslocoLoader {
  getTranslation() {
    return of(EN);
  }
}

function alias(over: Partial<ModelAlias> = {}): ModelAlias {
  return {
    id: 1,
    name: 'gpt-fast',
    service_id: 3,
    physical_model: 'gpt-4o-mini',
    label: null,
    is_active: true,
    ...over,
  };
}

function connections(n: number): PickerItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    label: `connection_${String(i + 1).padStart(3, '0')}`,
  }));
}

describe('DfAiAliasesComponent', () => {
  let fixture: ComponentFixture<DfAiAliasesComponent>;
  let component: DfAiAliasesComponent;
  let available$: BehaviorSubject<boolean>;
  let probed: ModelAlias[] | null;
  let api: {
    aliases: jest.Mock;
    createAlias: jest.Mock;
    updateAlias: jest.Mock;
    scopeOptions: jest.Mock;
    searchScope: jest.Mock;
  };

  const el = (): HTMLElement => fixture.nativeElement;
  const q = (testId: string) =>
    el().querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  const qa = (testId: string) =>
    Array.from(el().querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));

  function create(available: boolean) {
    available$.next(available);
    fixture = TestBed.createComponent(DfAiAliasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    available$ = new BehaviorSubject<boolean>(false);
    probed = [alias()];
    api = {
      aliases: jest.fn(() => of([alias()])),
      createAlias: jest.fn(() => of(alias({ id: 2, name: 'new-alias' }))),
      updateAlias: jest.fn(() => of(alias({ is_active: false }))),
      scopeOptions: jest.fn(() =>
        of({ items: connections(5), truncated: false })
      ),
      searchScope: jest.fn(() => of([])),
    };
    TestBed.configureTestingModule({
      imports: [DfAiAliasesComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: InlineLoader,
        }),
        { provide: BudgetsService, useValue: api },
        {
          provide: AiBudgetsAvailabilityService,
          useValue: {
            available$,
            takeProbedAliases: () => {
              const out = probed;
              probed = null;
              return out;
            },
          },
        },
      ],
    });
  });

  it('renders nothing and requests nothing on a server without the alias API', () => {
    create(false);
    expect(q('aliases')).toBeNull();
    expect(el().textContent?.trim()).toBe('');
    expect(api.aliases).not.toHaveBeenCalled();
    // The system/service call that used to run on every AI page load.
    expect(api.scopeOptions).not.toHaveBeenCalled();
  });

  it('uses the alias list from the shared check, so the page costs no second request', () => {
    create(true);
    expect(q('aliases')).not.toBeNull();
    expect(api.aliases).not.toHaveBeenCalled();
    expect(api.scopeOptions).toHaveBeenCalledTimes(1);
    expect(api.scopeOptions).toHaveBeenCalledWith('service');
    expect(qa('alias-row')).toHaveLength(1);
    expect(qa('alias-row')[0].textContent).toContain('gpt-fast');
    expect(qa('alias-row')[0].textContent).toContain('connection_003');
  });

  it('loads the list itself when the shared check has no fresh copy', () => {
    probed = null;
    create(true);
    expect(api.aliases).toHaveBeenCalledTimes(1);
    expect(qa('alias-row')).toHaveLength(1);
  });

  it('appears when the check passes after the page opened', () => {
    create(false);
    available$.next(true);
    fixture.detectChanges();
    expect(q('aliases')).not.toBeNull();
    expect(api.scopeOptions).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state with no aliases', () => {
    probed = [];
    create(true);
    expect(q('alias-empty')?.textContent).toContain('No aliases yet.');
    expect(q('alias-table')).toBeNull();
  });

  it('shows the error when the list fails', () => {
    probed = null;
    api.aliases.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { error: { code: 500, message: 'Database is down.' } },
          })
      )
    );
    create(true);
    expect(q('alias-error')?.textContent).toContain('Database is down.');
    expect(q('alias-empty')).toBeNull();
  });

  it('names a connection it could not load by id', () => {
    probed = [alias({ service_id: 999 })];
    create(true);
    expect(qa('alias-row')[0].textContent).toContain('#999');
  });

  describe('scale', () => {
    it('renders one page of 300 aliases and adds a page on demand', () => {
      probed = Array.from({ length: 300 }, (_, i) =>
        alias({ id: i + 1, name: `alias_${i + 1}` })
      );
      create(true);
      expect(qa('alias-row')).toHaveLength(ALIAS_PAGE_SIZE);
      const before = component.visible;
      fixture.detectChanges();
      expect(component.visible).toBe(before);
      q('alias-more')!.click();
      fixture.detectChanges();
      expect(qa('alias-row')).toHaveLength(ALIAS_PAGE_SIZE * 2);
    });

    it('bounds the connection picker at 400 connections', () => {
      api.scopeOptions.mockReturnValue(
        of({ items: connections(400), truncated: true })
      );
      create(true);
      expect(qa('alias-connections-item').length).toBeLessThanOrEqual(60);
      expect(q('alias-connections-search')).not.toBeNull();
      expect(el().querySelectorAll('mat-option')).toHaveLength(0);

      api.searchScope.mockReturnValue(of([{ id: 777, label: 'far-away' }]));
      component.searchConnections('far').subscribe();
      expect(api.searchScope).toHaveBeenCalledWith('service', 'far');
      component.pickConnection(777);
      fixture.detectChanges();
      expect(q('alias-connection-selected')?.textContent).toContain('far-away');
    });
  });

  describe('create', () => {
    function fill() {
      component.draft.name = ' claude-main ';
      component.draft.physical_model = ' claude-sonnet-4-6 ';
      component.pickConnection(2);
      fixture.detectChanges();
    }

    it('keeps Add disabled until name, model and connection are set', () => {
      create(true);
      const add = q('alias-add') as HTMLButtonElement;
      expect(add.disabled).toBe(true);
      component.draft.name = 'x';
      component.draft.physical_model = '   ';
      component.pickConnection(2);
      expect(component.canCreate).toBe(false);
      component.draft.physical_model = 'model';
      expect(component.canCreate).toBe(true);
      // Picking the same connection again clears it.
      component.pickConnection(2);
      expect(component.canCreate).toBe(false);
    });

    it('posts a trimmed alias, adds the saved row and clears the form', () => {
      create(true);
      fill();
      component.create();
      fixture.detectChanges();
      expect(api.createAlias).toHaveBeenCalledWith({
        name: 'claude-main',
        service_id: 2,
        physical_model: 'claude-sonnet-4-6',
      });
      expect(qa('alias-row')).toHaveLength(2);
      expect(component.draft.name).toBe('');
      expect(component.connectionSelected).toEqual([]);
    });

    it('sends one request for a double submit', () => {
      create(true);
      fill();
      const pending = new Subject<ModelAlias>();
      api.createAlias.mockReturnValue(pending);
      component.create();
      component.create();
      fixture.detectChanges();
      expect(api.createAlias).toHaveBeenCalledTimes(1);
      expect((q('alias-add') as HTMLButtonElement).disabled).toBe(true);
    });

    it('adds no row and keeps the draft when the server refuses', () => {
      create(true);
      fill();
      api.createAlias.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: {
                error: {
                  code: 400,
                  message: 'The name has already been taken.',
                },
              },
            })
        )
      );
      component.create();
      fixture.detectChanges();
      expect(qa('alias-row')).toHaveLength(1);
      expect(component.draft.name).toBe(' claude-main ');
      expect(q('alias-error')?.textContent).toContain(
        'The name has already been taken.'
      );
    });
  });

  describe('enable and disable', () => {
    const toggleButton = () =>
      el().querySelector<HTMLButtonElement>(
        '[data-testid="alias-row"] mat-slide-toggle button'
      )!;

    it('patches is_active and shows the saved row', () => {
      create(true);
      toggleButton().click();
      fixture.detectChanges();
      expect(api.updateAlias).toHaveBeenCalledWith(1, { is_active: false });
      expect(component.aliases[0].is_active).toBe(false);
    });

    it('puts the switch back and says why when the change fails', () => {
      create(true);
      api.updateAlias.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: { error: { code: 500, message: 'Write failed.' } },
            })
        )
      );
      toggleButton().click();
      fixture.detectChanges();
      expect(component.aliases[0].is_active).toBe(true);
      expect(toggleButton().getAttribute('aria-checked')).toBe('true');
      expect(q('alias-error')?.textContent).toContain('Write failed.');
    });

    it('locks the row while a change is in flight', () => {
      create(true);
      const pending = new Subject<ModelAlias>();
      api.updateAlias.mockReturnValue(pending);
      toggleButton().click();
      fixture.detectChanges();
      expect(toggleButton().disabled).toBe(true);
      toggleButton().click();
      expect(api.updateAlias).toHaveBeenCalledTimes(1);
    });
  });

  it('has no untranslated key on screen', () => {
    create(true);
    expect(el().textContent).not.toMatch(/aiBudgets\./);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { of } from 'rxjs';
import {
  CellState,
  DfScopeService,
  ScopeMatrixRoleRow,
  ScopeVerb,
  SCOPE_VERBS,
} from 'src/app/shared/services/df-scope.service';
import { DfScopeMatrixComponent } from './df-scope-matrix.component';

// Subset of src/assets/i18n/en.json used by the matrix.
const en = {
  scopeMatrix: {
    ariaLabel: 'Roles by HTTP verb access for this service',
    roleHeader: 'Role',
    emptyTitle: 'No roles yet',
    emptyHint: 'Create a role to grant agents and keys scoped access.',
    state: {
      full: 'Full access',
      filtered: 'Row or field filtered',
      none: 'No access',
    },
    searchPlaceholder: 'Search roles…',
    withAccess: 'With access ({{count}})',
    allRoles: 'All roles ({{count}})',
    shownOf: '{{shown}} of {{total}} roles shown',
    showMore: 'Show {{count}} more',
    noMatch: 'No roles match “{{query}}”.',
    noneReach:
      'No role can reach this service yet. Switch to all roles to see every role.',
  },
};

/** `n` roles named qa-role-001.., the ids in `reaching` hold GET on the service. */
function roles(n: number, reaching: number[] = []): ScopeMatrixRoleRow[] {
  return Array.from({ length: n }, (_, i) => {
    const id = i + 1;
    const verbs = {} as Record<ScopeVerb, CellState>;
    for (const v of SCOPE_VERBS) {
      verbs[v] = 'none';
    }
    if (reaching.includes(id)) {
      verbs.GET = 'full';
    }
    return {
      roleId: id,
      roleName: `qa-role-${String(id).padStart(3, '0')}`,
      verbs,
    };
  });
}

describe('DfScopeMatrixComponent', () => {
  let fixture: ComponentFixture<DfScopeMatrixComponent>;
  let component: DfScopeMatrixComponent;
  let el: HTMLElement;
  let matrixRoles: ScopeMatrixRoleRow[];
  const scope = {
    matrixForService: jest.fn((serviceId: number) =>
      of({ serviceId, roles: matrixRoles })
    ),
  };

  const load = (list: ScopeMatrixRoleRow[], serviceId = 7) => {
    matrixRoles = list;
    fixture.componentRef.setInput('serviceId', serviceId);
    fixture.detectChanges();
  };
  const q = (testId: string) =>
    el.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
  const rowNames = () =>
    Array.from(
      el.querySelectorAll(
        '[data-testid="scope-matrix-row"] .scope-matrix__role'
      )
    ).map(n => n.textContent?.trim());
  const status = () => q('scope-matrix-status')?.textContent?.trim() ?? null;
  const click = (testId: string) => {
    q(testId)?.click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    scope.matrixForService.mockClear();
    TestBed.configureTestingModule({
      imports: [
        DfScopeMatrixComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [{ provide: DfScopeService, useValue: scope }],
    });
    fixture = TestBed.createComponent(DfScopeMatrixComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  describe('twelve roles or fewer: plain grid', () => {
    it('lists every role, with or without access, and no controls', () => {
      load(roles(12, [3]));
      expect(scope.matrixForService).toHaveBeenCalledWith(7);
      expect(rowNames()).toEqual(roles(12).map(r => r.roleName));
      expect(q('scope-matrix-search')).toBeNull();
      expect(q('scope-matrix-view-all')).toBeNull();
      expect(el.querySelector('.scope-matrix__grid--bounded')).toBeNull();
      expect(status()).toBeNull();
      // The roles without access are on the grid, muted and not clickable.
      const cells = el.querySelectorAll<HTMLButtonElement>(
        '[data-testid="scope-matrix-row"] .scope-matrix__cell'
      );
      expect(cells.length).toBe(12 * SCOPE_VERBS.length);
      expect(el.querySelectorAll('.scope-matrix__cell--full').length).toBe(1);
      expect(Array.from(cells).filter(c => c.disabled).length).toBe(
        12 * SCOPE_VERBS.length - 1
      );
    });

    it('lists every role when none reaches the service, without pointing at a switch that is not there', () => {
      load(roles(5));
      expect(rowNames().length).toBe(5);
      expect(status()).toBeNull();
      expect(el.textContent).not.toContain('Switch to all roles');
    });
  });

  describe('more than twelve roles: bounded grid', () => {
    it('lists roles with access by default and all roles behind the toggle', () => {
      load(roles(13, [3]));
      expect(rowNames()).toEqual(['qa-role-003']);
      expect(q('scope-matrix-search')).not.toBeNull();
      expect(el.querySelector('.scope-matrix__grid--bounded')).not.toBeNull();
      expect(q('scope-matrix-view-access')?.textContent?.trim()).toBe(
        'With access (1)'
      );
      expect(q('scope-matrix-view-all')?.textContent?.trim()).toBe(
        'All roles (13)'
      );

      click('scope-matrix-view-all');
      expect(rowNames().length).toBe(13);
      expect(q('scope-matrix-view-all')?.getAttribute('aria-pressed')).toBe(
        'true'
      );

      click('scope-matrix-view-access');
      expect(rowNames()).toEqual(['qa-role-003']);
    });

    it('says no role reaches the service and offers the switch', () => {
      load(roles(13));
      expect(rowNames()).toEqual([]);
      expect(status()).toBe(en.scopeMatrix.noneReach);
      click('scope-matrix-view-all');
      expect(rowNames().length).toBe(13);
      expect(status()).toBeNull();
    });

    it('finds a role without access by name from the default view', () => {
      load(roles(13, [3]));
      component.onQuery('ROLE-01');
      fixture.detectChanges();
      expect(rowNames()).toEqual([
        'qa-role-010',
        'qa-role-011',
        'qa-role-012',
        'qa-role-013',
      ]);
      component.onQuery('nope');
      fixture.detectChanges();
      expect(rowNames()).toEqual([]);
      expect(status()).toBe('No roles match “nope”.');
    });

    it('renders one page of 60 rows at a time', () => {
      const all = Array.from({ length: 314 }, (_, i) => i + 1);
      load(roles(314, all));
      expect(rowNames().length).toBe(60);
      expect(status()).toBe('60 of 314 roles shown');
      click('scope-matrix-more');
      expect(rowNames().length).toBe(120);
    });
  });

  describe('crossing the threshold between loads', () => {
    it('ignores a leftover query and view when the list shrinks to a plain grid', () => {
      load(roles(13, [3]));
      component.setShowAll(true);
      component.onQuery('qa-role-013');
      fixture.detectChanges();
      expect(rowNames()).toEqual(['qa-role-013']);

      load(roles(12, [3]), 8);
      expect(rowNames().length).toBe(12);
      expect(q('scope-matrix-search')).toBeNull();
      expect(status()).toBeNull();
    });

    it('starts on roles with access when the list grows past twelve', () => {
      load(roles(12, [3]));
      expect(rowNames().length).toBe(12);

      load(roles(13, [3]), 8);
      expect(rowNames()).toEqual(['qa-role-003']);
      expect(q('scope-matrix-view-all')).not.toBeNull();
    });
  });
});

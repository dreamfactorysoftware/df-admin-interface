import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import { BehaviorSubject, of } from 'rxjs';
import { DfSideNavComponent } from 'src/app/shared/components/df-side-nav/df-side-nav.component';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { Nav } from 'src/app/shared/types/nav';
import { ROUTES } from 'src/app/shared/types/routes';
import { UserSession } from 'src/app/shared/types/user';
import { AiBudgetsAvailabilityService } from './ai-budgets-availability.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: Translation = require('../../assets/i18n/en.json');

@Injectable()
class InlineLoader implements TranslocoLoader {
  getTranslation() {
    return of(EN);
  }
}

/**
 * The Budgets nav entry in the real side nav. It must stay hidden until the
 * server is known to have the budget API, for every kind of user: a root
 * admin gets the whole route table with no tab filter, so the gate cannot
 * live in the tab filter alone.
 */
describe('side nav: AI Budgets entry', () => {
  let fixture: ComponentFixture<DfSideNavComponent>;
  let component: DfSideNavComponent;
  let available$: BehaviorSubject<boolean>;
  let userData$: BehaviorSubject<UserSession | null>;
  let restrictedAccess$: BehaviorSubject<string[]>;

  const aiRoutes = (): ROUTES[] =>
    (
      component.nav.find((item: Nav) => item.route === ROUTES.AI)?.subRoutes ??
      []
    ).map((item: Nav) => item.route);

  function create(user: Partial<UserSession>, tabs: string[] = []) {
    userData$.next(user as UserSession);
    restrictedAccess$.next(tabs);
    fixture = TestBed.createComponent(DfSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    available$ = new BehaviorSubject<boolean>(false);
    userData$ = new BehaviorSubject<UserSession | null>(null);
    restrictedAccess$ = new BehaviorSubject<string[]>([]);
    TestBed.configureTestingModule({
      imports: [
        DfSideNavComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule,
      ],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: InlineLoader,
        }),
        { provide: ActivatedRoute, useValue: { data: of({}) } },
        { provide: AiBudgetsAvailabilityService, useValue: { available$ } },
        {
          provide: DfUserDataService,
          useValue: {
            userData$,
            restrictedAccess$,
            isLoggedIn$: of(true),
            get userData() {
              return userData$.value;
            },
          },
        },
      ],
    });
  });

  const rootAdmin = { id: 1, isRootAdmin: true, isSysAdmin: true };
  // An admin limited to tabs: the server gives such an admin a role.
  const restrictedAdmin = {
    id: 2,
    isRootAdmin: false,
    isSysAdmin: true,
    roleId: 9,
    role_id: 9,
  };

  it('is hidden from a root admin until the server is known to have budgets', () => {
    create(rootAdmin);
    expect(aiRoutes()).toContain(ROUTES.AI_USAGE);
    expect(aiRoutes()).not.toContain(ROUTES.AI_BUDGETS);
  });

  it('appears next to Usage once the check passes, with no reload', () => {
    create(rootAdmin);
    available$.next(true);
    fixture.detectChanges();
    const routes = aiRoutes();
    expect(routes.indexOf(ROUTES.AI_BUDGETS)).toBe(
      routes.indexOf(ROUTES.AI_USAGE) + 1
    );
  });

  it('goes away again when the check stops passing', () => {
    available$.next(true);
    create(rootAdmin);
    expect(aiRoutes()).toContain(ROUTES.AI_BUDGETS);
    available$.next(false);
    fixture.detectChanges();
    expect(aiRoutes()).not.toContain(ROUTES.AI_BUDGETS);
  });

  it('leaves every other nav entry as it was', () => {
    create(rootAdmin);
    const hidden = JSON.stringify(component.nav);
    available$.next(true);
    fixture.detectChanges();
    const shown = component.nav;
    const ai = shown.find((item: Nav) => item.route === ROUTES.AI) as Nav;
    ai.subRoutes = ai.subRoutes?.filter(
      (item: Nav) => item.route !== ROUTES.AI_BUDGETS
    );
    expect(JSON.stringify(shown)).toBe(hidden);
  });

  it('is hidden from a restricted admin whom the server refuses, like any dead link', () => {
    create(restrictedAdmin, ['apps']);
    expect(aiRoutes()).toContain(ROUTES.AI_USAGE);
    expect(aiRoutes()).not.toContain(ROUTES.AI_BUDGETS);
  });

  it('follows the tab model of its AI siblings when the server accepts a restricted admin', () => {
    available$.next(true);
    // No AI tab exists in the restricted admin model: the AI pages are always
    // allowed, and Budgets sits in that same list.
    create(restrictedAdmin, ['apps']);
    expect(aiRoutes()).toContain(ROUTES.AI_USAGE);
    expect(aiRoutes()).toContain(ROUTES.AI_BUDGETS);
    // The tab filter did run: a section with no allowed tab is gone.
    expect(component.nav.map((item: Nav) => item.route)).not.toContain(
      ROUTES.ADMIN_SETTINGS
    );
  });
});

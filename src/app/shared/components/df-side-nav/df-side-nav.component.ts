import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DfAuthService } from 'src/app/adf-user-management/services/df-auth.service';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { DfThemeService } from '../../services/df-theme.service';

import {
  faAngleDown,
  faBars,
  faLanguage,
  faMagnifyingGlass,
  faUser,
  faRefresh,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from 'src/app/routes';
import {
  accessibleRoutes,
  generateBreadcrumb,
  transformRoutes,
} from '../../utilities/route';
import { Nav } from '../../types/nav';
import { ROUTES } from '../../types/routes';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { DfErrorService } from 'src/app/shared/services/df-error.service';
import { DfLicenseCheckService } from '../../services/df-license-check.service';
import { debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfSearchDialogComponent } from '../df-search-dialog/df-search-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CommonModule } from '@angular/common';
import { DfSearchService } from '../../services/df-search.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DfThemeToggleComponent } from '../df-theme-toggle/df-theme-toggle.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfPaywallService } from '../../services/df-paywall.service';
import { DfSystemConfigDataService } from '../../services/df-system-config-data.service';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-side-nav',
  templateUrl: './df-side-nav.component.html',
  styleUrls: ['./df-side-nav.component.scss'],
  standalone: true,
  imports: [
    MatSidenavModule,
    MatListModule,
    FontAwesomeModule,
    MatToolbarModule,
    MatButtonModule,
    MatExpansionModule,
    RouterModule,
    MatMenuModule,
    TranslocoPipe,
    AsyncPipe,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    MatDialogModule,
    CommonModule,
    MatFormFieldModule,
    DfThemeToggleComponent,
    ReactiveFormsModule,
    MatInputModule,
  ],
})
export class DfSideNavComponent implements OnInit {
  isSmallScreen = this.breakpointService.isSmallScreen;
  isLoggedIn$ = this.userDataService.isLoggedIn$;
  userData$ = this.userDataService.userData$;
  faAngleDown = faAngleDown;
  faBars = faBars;
  hasError$ = this.errorService.hasError$;
  nav: Array<Nav> = [];
  navGroups: Array<{ label: string; items: Array<Nav> }> = [];
  licenseCheck$ = this.licenseCheckService.licenseCheck$;
  faMagnifyingGlass = faMagnifyingGlass;
  faUser = faUser;
  faLanguage = faLanguage;
  search = new FormControl();
  results$ = this.searchService.results$;
  smallScreen$ = this.breakpointService.isSmallScreen;
  faPlus = faPlus;
  faRefresh = faRefresh;
  licenseType: string = 'OPEN SOURCE';

  constructor(
    private breakpointService: DfBreakpointService,
    private userDataService: DfUserDataService,
    private authService: DfAuthService,
    private router: Router,
    private errorService: DfErrorService,
    private licenseCheckService: DfLicenseCheckService,
    private dialog: MatDialog,
    private transloco: TranslocoService,
    private themeService: DfThemeService,
    private searchService: DfSearchService,
    private snackbarService: DfSnackbarService,
    private paywallService: DfPaywallService,
    private systemConfigDataService: DfSystemConfigDataService
  ) {}

  ngOnInit(): void {
    this.userData$
      .pipe(
        switchMap(userData => {
          if (userData?.isRootAdmin) {
            return of(null);
          }
          if (
            userData?.isSysAdmin &&
            (!userData.roleId || !userData?.id || !userData?.role_id)
          ) {
            return of(null);
          }
          if (
            userData?.isSysAdmin &&
            (userData.roleId || userData?.id || userData?.role_id)
          ) {
            return this.userDataService.restrictedAccess$;
          }
          if (userData?.roleId || userData?.id || userData?.role_id) {
            return of([
              'apps',
              'users',
              'roles',
              'services',
              'apidocs',
              'schema/data',
              'files',
              'scripts',
              'systemInfo',
              'limits',
              'scheduler',
            ]);
          }
          return of([]);
        })
      )
      .subscribe(accessByTabs => {
        if (accessByTabs) {
          this.nav = accessibleRoutes(transformRoutes(routes), accessByTabs);
        } else {
          this.nav = transformRoutes(routes);
        }
        this.navGroups = this.buildNavGroups(this.nav);
      });
    this.search.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap(value => this.searchService.search(value))
      )
      .subscribe(() => {
        this.dialog.open(DfSearchDialogComponent, {
          position: { top: '60px' },
        });
      });
    this.systemConfigDataService.environment$
      .pipe(map(env => env.platform?.license ?? 'OPEN SOURCE'))
      .subscribe(license => (this.licenseType = license));
  }
  isDarkMode = this.themeService.darkMode$;

  /**
   * Pillar IA for the shell prototype: group the flat top-level nav into
   * product pillars. Presentation-only; the route table is untouched and
   * any item not claimed by a pillar still renders in a trailing group so
   * restricted-access nav sets never lose entries.
   */
  private buildNavGroups(
    nav: Array<Nav>
  ): Array<{ label: string; items: Array<Nav> }> {
    const byRoute = new Map(nav.map(item => [item.route, item]));
    const claimed = new Set<Nav>();
    const pick = (routeIds: Array<ROUTES>) =>
      routeIds
        .map(id => byRoute.get(id))
        .filter((item): item is Nav => {
          if (!item) return false;
          claimed.add(item);
          return true;
        });
    const groups = [
      { label: '', items: pick([ROUTES.HOME]) },
      {
        label: 'Build',
        items: pick([ROUTES.API_CONNECTIONS, ROUTES.API_BUILDER]),
      },
      { label: 'Secure & Manage', items: pick([ROUTES.API_SECURITY]) },
      {
        label: 'AI Gateway',
        items: pick([ROUTES.AI, ROUTES.AGENTS, ROUTES.ALERTS]),
      },
      {
        label: 'System',
        items: pick([ROUTES.SYSTEM_SETTINGS, ROUTES.ADMIN_SETTINGS]),
      },
      { label: '', items: nav.filter(item => !claimed.has(item)) },
    ];
    return groups.filter(group => group.items.length);
  }

  trackByGroupLabel = (
    index: number,
    group: { label: string; items: Array<Nav> }
  ) => `${index}-${group.label}`;

  /** Last breadcrumb = the current page; rendered as the content H1. */
  get currentCrumb() {
    const crumbs = this.breadCrumbs;
    return crumbs.length ? crumbs[crumbs.length - 1] : undefined;
  }

  logout() {
    this.authService.logout();
  }

  isActive(nav: Nav) {
    return this.router.url.startsWith(nav.path);
  }

  // Nav routes are static, so the label key is computed once per route
  // instead of allocating split/join intermediates on every CD cycle.
  private navLabelCache = new Map<string, string>();
  navLabel(route: string) {
    let label = this.navLabelCache.get(route);
    if (label === undefined) {
      const segments = route.replace('/', '').split('/').join('.');
      label = `nav.${segments}.nav`;
      this.navLabelCache.set(route, label);
    }
    return label;
  }

  navLink(nav: Nav) {
    return nav.linkPath ?? nav.path;
  }
  // Memoized on router.url: generateBreadcrumb walks the route table
  // recursively and allocates arrays per visited route, and the side-nav
  // renders on every page, so this ran on every CD tick app-wide.
  private _breadCrumbs: ReturnType<typeof generateBreadcrumb> = [];
  private _breadCrumbsUrl?: string;
  get breadCrumbs() {
    if (this._breadCrumbsUrl !== this.router.url) {
      this._breadCrumbsUrl = this.router.url;
      this._breadCrumbs = generateBreadcrumb(routes, this.router.url);
    }
    return this._breadCrumbs;
  }

  handleNavClick(nav: Nav) {
    // Leaf nav items now route via [routerLink] on <a>; this handler only
    // clears any route-level error banner so the new page starts clean.
    // Kept as a (click) handler rather than a router-event subscription
    // because we want to wipe the error *before* the navigation renders.
    this.errorService.error = null;
    // Still useful for programmatic callers (keyboard shortcuts / search)
    // that don't trigger the anchor. No-op when the anchor has already
    // navigated to the same URL.
    const linkPath = this.navLink(nav);
    if (this.router.url !== linkPath) {
      this.router.navigate([linkPath]);
    }
  }

  /** Stable data-testid for a leaf nav item. */
  navTestId(path: string): string {
    return `nav-${this.normalizePath(path)}`;
  }

  /** Stable data-testid for a nav category (expansion panel header). */
  navGroupTestId(path: string): string {
    return `nav-group-${this.normalizePath(path)}`;
  }

  trackByNavPath = (_: number, item: Nav) => item.path;

  private normalizePath(path: string): string {
    return path.replace(/^\/+/, '').replace(/\//g, '-') || 'root';
  }

  handleSearchClick() {
    this.dialog.open(DfSearchDialogComponent, { position: { top: '60px' } });
  }

  handleLanguageChange(language: string) {
    this.transloco.setActiveLang(language);
    localStorage.setItem('language', language);
  }

  onSubmit() {
    this.searchService.search(this.search.value).subscribe(() => {
      this.dialog.open(DfSearchDialogComponent, { position: { top: '60px' } });
    });
  }

  get activeLanguage() {
    return this.transloco.getActiveLang();
  }

  get availableLanguages() {
    return this.transloco.getAvailableLangs() as string[];
  }

  isFeatureLocked(route: string, licenseType: string): boolean {
    return this.paywallService.isFeatureLocked(route, licenseType);
  }
}

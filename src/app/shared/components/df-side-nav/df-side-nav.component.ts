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
import {
  faAngleDown,
  faBars,
  faLanguage,
  faMagnifyingGlass,
  faPlus,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from 'src/app/routes';
import {
  accessibleRoutes,
  generateBreadcrumb,
  transformRoutes,
} from '../../utilities/route';
import { Nav } from '../../types/nav';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { DfErrorService } from 'src/app/shared/services/df-error.service';
import { DfLicenseCheckService } from '../../services/df-license-check.service';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DfSearchDialogComponent } from '../df-search-dialog/df-search-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CommonModule } from '@angular/common';
import { DfSearchService } from '../../services/df-search.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
    ReactiveFormsModule,
    MatFormFieldModule,
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
  licenseCheck$ = this.licenseCheckService.licenseCheck$;
  faMagnifyingGlass = faMagnifyingGlass;
  faUser = faUser;
  faLanguage = faLanguage;
  search = new FormControl();
  results$ = this.searchService.results$;
  recents$ = this.searchService.recents$;
  smallScreen$ = this.breakpointService.isSmallScreen;
  faPlus = faPlus;

  constructor(
    // public dialogRef: MatDialogRef<DfSearchDialogComponent>,
    private breakpointService: DfBreakpointService,
    private userDataService: DfUserDataService,
    private authService: DfAuthService,
    private router: Router,
    private errorService: DfErrorService,
    private licenseCheckService: DfLicenseCheckService,
    private dialog: MatDialog,
    private transloco: TranslocoService,
    private searchService: DfSearchService
  ) {}

  ngOnInit(): void {
    this.userData$
      .pipe(
        switchMap(userData => {
          if (userData?.isRootAdmin) {
            return of(null);
          }
          if (userData?.isSysAdmin && !userData.roleId) {
            return of(null);
          }
          if (userData?.isSysAdmin && userData.roleId) {
            return this.userDataService.restrictedAccess$;
          }
          if (userData?.roleId) {
            return of([
              'apps',
              'users',
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
          console.log('this.nav', this.nav);
        }
      });
    this.search.valueChanges
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        switchMap(value => this.searchService.search(value))
      )
      .subscribe(() => {
        this.dialog.open(DfSearchDialogComponent, {
          position: { top: '60px' },
        });
      });
  }

  logout() {
    this.authService.logout();
  }

  isActive(nav: Nav) {
    return this.router.url.startsWith(nav.path);
  }

  navLabel(route: string) {
    const segments = route.replace('/', '').split('/').join('.');
    return `nav.${segments}.nav`;
  }

  get breadCrumbs() {
    return generateBreadcrumb(routes, this.router.url);
  }

  handleNavClick(nav: Nav) {
    this.errorService.error = null;
    this.router.navigate([nav.path]);
  }

  handleLanguageChange(language: string) {
    this.transloco.setActiveLang(language);
    localStorage.setItem('language', language);
  }

  get activeLanguage() {
    return this.transloco.getActiveLang();
  }

  get availableLanguages() {
    return this.transloco.getAvailableLangs() as string[];
  }

  getTranslationKey(path: string) {
    return `nav.${path.replaceAll('/', '.')}.nav`;
  }
}

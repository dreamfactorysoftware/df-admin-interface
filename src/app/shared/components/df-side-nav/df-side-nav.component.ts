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
  faMagnifyingGlass,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from 'src/app/routes';
import {
  accessibleRoutes,
  generateBreadcrumb,
  transformRoutes,
} from '../../utilities/route';
import { Nav } from '../../types/nav';
import { TranslocoPipe } from '@ngneat/transloco';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { DfErrorService } from 'src/app/shared/services/df-error.service';
import { DfLicenseCheckService } from '../../services/df-license-check.service';
import { of, switchMap } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfSearchDialogComponent } from '../df-search-dialog/df-search-dialog.component';

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

  constructor(
    private breakpointService: DfBreakpointService,
    private userDataService: DfUserDataService,
    private authService: DfAuthService,
    private router: Router,
    private errorService: DfErrorService,
    private licenseCheckService: DfLicenseCheckService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userData$
      .pipe(
        switchMap(userData => {
          if (userData?.isRootAdmin) {
            return of(null);
          }
          if (userData?.isSysAdmin) {
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
        }
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

  handleSearchClick() {
    this.dialog.open(DfSearchDialogComponent, { position: { top: '60px' } });
  }
}

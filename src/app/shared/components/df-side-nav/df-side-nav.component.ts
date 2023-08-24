import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleDown, faBars } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DfAuthService } from 'src/app/adf-user-management/services/df-auth.service';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { DfUserDataService } from 'src/app/core/services/df-user-data.service';
import { Nav } from '../../types/nav';
import { NAV } from 'src/app/core/constants/routes';

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
    CommonModule,
    RouterModule,
    TranslateModule,
    MatMenuModule,
  ],
})
export class DfSideNavComponent {
  isSmallScreen = this.breakpointService.isSmallScreen;
  isLoggedIn$ = this.userDataService.isLoggedIn$;
  userData$ = this.userDataService.userData$;
  faAngleDown = faAngleDown;
  faBars = faBars;

  nav = NAV;

  constructor(
    private breakpointService: DfBreakpointService,
    private userDataService: DfUserDataService,
    private authService: DfAuthService,
    private router: Router,
    private translateService: TranslateService
  ) {}

  logout() {
    this.authService.logout();
  }

  isActive(nav: Nav) {
    return this.router.url.startsWith('/' + nav.route);
  }

  navLabel(route: string): string {
    const segments = route.split('/').join('.');
    let label = this.translateService.instant(`nav.${segments}.nav`);
    if (typeof label !== 'string' || label === `nav.${segments}.nav`) {
      label = this.translateService.instant(`nav.${segments}.header`);
    }
    return label;
  }

  pageHeader(): string {
    const segments = this.router.url.replace('/', '').split('/');
    // Remove the last segment if it is a number  (e.g. /admins/edit/1)
    if (/^[+-]?\d+$/.test(segments[segments.length - 1])) {
      segments.pop();
    }
    return this.translateService.instant(`nav.${segments.join('.')}.header`);
  }
}

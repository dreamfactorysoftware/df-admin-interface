import { Component } from '@angular/core';
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
import { faAngleDown, faBars } from '@fortawesome/free-solid-svg-icons';
import { routes } from 'src/app/routes';
import { generateBreadcrumb, transformRoutes } from '../../utilities/route';
import { Nav } from '../../types/nav';
import { TranslocoPipe } from '@ngneat/transloco';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { DfErrorService } from 'src/app/shared/services/df-error.service';

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
  ],
})
export class DfSideNavComponent {
  isSmallScreen = this.breakpointService.isSmallScreen;
  isLoggedIn$ = this.userDataService.isLoggedIn$;
  userData$ = this.userDataService.userData$;
  faAngleDown = faAngleDown;
  faBars = faBars;
  hasError$ = this.errorService.hasError$;
  nav = transformRoutes(routes);

  constructor(
    private breakpointService: DfBreakpointService,
    private userDataService: DfUserDataService,
    private authService: DfAuthService,
    private router: Router,
    private errorService: DfErrorService
  ) {}

  logout() {
    this.authService.logout();
  }

  isActive(nav: Nav) {
    return this.router.url.startsWith(nav.route);
  }

  navLabel(route: string) {
    const segments = route.replace('/', '').split('/').join('.');
    return `nav.${segments}.nav`;
  }

  get breadCrumbs() {
    return generateBreadcrumb(routes, this.router.url);
  }
}

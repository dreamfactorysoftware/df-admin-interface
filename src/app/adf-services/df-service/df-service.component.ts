import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTES } from 'src/app/core/constants/routes';
@Component({
  selector: 'df-service',
  templateUrl: './df-service.component.html',
  styleUrls: ['./df-service.component.scss'],
})
export class DfServiceComponent {
  constructor(private router: Router) {}

  navigateToCreateServicePage() {
    this.router.navigate([ROUTES.CREATE_SERVICES]);
  }
}

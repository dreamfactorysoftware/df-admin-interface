import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { ROUTES } from 'src/app/shared/types/routes';
import { AiBudgetsAvailabilityService } from './ai-budgets-availability.service';

/**
 * The "Manage budgets" button for other AI pages. It renders nothing unless
 * the server has the budget API and accepts this user, so a page that hosts
 * it never links to a screen that cannot load.
 */
@Component({
  selector: 'df-ai-budgets-link',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, MatButtonModule, TranslocoPipe],
  template: `
    <a
      *ngIf="available$ | async"
      mat-stroked-button
      data-testid="manage-budgets"
      [routerLink]="link">
      {{ 'aiBudgets.manage' | transloco }}
    </a>
  `,
})
export class DfAiBudgetsLinkComponent {
  readonly available$ = inject(AiBudgetsAvailabilityService).available$;
  readonly link = `/${ROUTES.AI}/${ROUTES.AI_BUDGETS}`;
}

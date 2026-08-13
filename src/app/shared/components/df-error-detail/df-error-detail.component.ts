import { NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  AppError,
  formatForSupport,
  rawErrorBody,
} from '../../utilities/app-error';

/**
 * Expandable technical detail for an AppError: status, method + URL, field
 * errors, raw body (as received, snake_case) and a copy-for-support button.
 * Collapsed it renders only the expander toggle; the host owns the headline
 * message. Usable inline (table error state, /error page, alert banners) and
 * inside DfErrorDetailDialogComponent for the toast's Details action.
 */
@Component({
  selector: 'df-error-detail',
  templateUrl: './df-error-detail.component.html',
  styleUrls: ['./df-error-detail.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, MatButtonModule, FontAwesomeModule, TranslocoPipe],
})
export class DfErrorDetailComponent {
  @Input({ required: true }) error: AppError;
  @Input() expanded = false;

  faCopy = faCopy;
  faCheck = faCheck;
  copied = false;

  get rawBody(): string {
    return rawErrorBody(this.error);
  }

  copyForSupport(): void {
    navigator.clipboard.writeText(formatForSupport(this.error)).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }
}

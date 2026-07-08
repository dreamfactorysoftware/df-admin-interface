import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DfRoleScopeComponent } from 'src/app/shared/components/df-role-scope/df-role-scope.component';
import { ScopeVerb } from 'src/app/shared/services/df-scope.service';

export interface ServiceRoleScopeDialogData {
  roleId: number;
  verb: ScopeVerb;
  serviceLabel: string;
}

/**
 * df-service-role-scope-dialog: the mat-dialog host for a scope-matrix cell.
 *
 * Clicking a granted cell in df-scope-matrix opens this: the existing
 * df-role-scope editor, framed with a consequence hint so an operator sees
 * what the role actually reaches before touching a grant.
 */
@Component({
  selector: 'df-service-role-scope-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DfRoleScopeComponent,
  ],
  template: `
    <div class="scope-role-dialog">
      <header mat-dialog-title class="scope-role-dialog__head">
        <div class="scope-role-dialog__heading">
          <p class="scope-role-dialog__eyebrow">
            {{ 'services.access.dialog.eyebrow' | transloco }}
          </p>
          <h2 class="scope-role-dialog__title">
            {{
              'services.access.dialog.title'
                | transloco: { verb: data.verb, service: data.serviceLabel }
            }}
          </h2>
        </div>
        <button
          mat-icon-button
          mat-dialog-close
          class="scope-role-dialog__close"
          [attr.aria-label]="'services.access.dialog.close' | transloco">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-dialog-content class="scope-role-dialog__content">
        <p class="scope-role-dialog__hint">
          {{ 'services.access.dialog.hint' | transloco }}
        </p>
        <df-role-scope [roleId]="data.roleId"></df-role-scope>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="scope-role-dialog__actions">
        <button mat-stroked-button mat-dialog-close>
          {{ 'services.access.dialog.close' | transloco }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .scope-role-dialog__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1.6rem;
        margin: 0;
      }
      .scope-role-dialog__eyebrow {
        margin: 0 0 0.2rem;
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--df-text-muted);
      }
      .scope-role-dialog__title {
        margin: 0;
        font-size: 1.8rem;
        line-height: 1.3;
        color: var(--df-text);
      }
      .scope-role-dialog__close {
        flex: 0 0 auto;
        color: var(--df-text-muted);
      }
      .scope-role-dialog__hint {
        margin: 0 0 1.6rem;
        color: var(--df-text-muted);
        font-size: 1.3rem;
        line-height: 1.5;
      }
    `,
  ],
})
export class DfServiceRoleScopeDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ServiceRoleScopeDialogData
  ) {}
}

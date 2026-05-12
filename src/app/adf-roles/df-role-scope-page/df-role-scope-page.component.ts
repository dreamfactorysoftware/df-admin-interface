import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { DfRoleScopeComponent } from 'src/app/shared/components/df-role-scope/df-role-scope.component';

@Component({
  selector: 'df-role-scope-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    TranslocoPipe,
    FontAwesomeModule,
    DfRoleScopeComponent,
  ],
  template: `
    <div class="df-role-scope-page">
      <a class="df-role-scope-page__back" mat-button [routerLink]="['..']">
        <fa-icon [icon]="faArrowLeft"></fa-icon>
        <span>{{ 'roles.roleScope.back' | transloco }}</span>
      </a>
      <df-role-scope *ngIf="roleId !== null" [roleId]="roleId">
        <a
          df-role-scope-error-action
          mat-stroked-button
          [routerLink]="['..', '..']">
          {{ 'roles.roleScope.errorRecovery' | transloco }}
        </a>
      </df-role-scope>
    </div>
  `,
  styles: [
    `
      .df-role-scope-page {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1.5rem 2rem 3rem;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
      }

      .df-role-scope-page__back {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
    `,
  ],
})
export class DfRoleScopePageComponent implements OnInit {
  roleId: number | null = null;
  faArrowLeft = faArrowLeft;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const raw = params.get('id');
      const parsed = raw ? Number(raw) : NaN;
      this.roleId = Number.isFinite(parsed) ? parsed : null;
    });
  }
}

import { Component, Inject } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { NgFor } from '@angular/common';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { EMAIL_TEMPLATES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfEmailTemplatesTableComponent } from './df-email-templates-table.component';

@Component({
  selector: 'df-email-templates',
  templateUrl: './df-email-templates.component.html',
  styleUrls: ['./df-email-templates.component.scss'],
  standalone: true,
  imports: [
    DfEmailTemplatesTableComponent,
    TranslocoModule,
    FontAwesomeModule,
    MatButtonModule,
    MatTableModule,
    NgFor,
  ],
})
export class DfEmailTemplatesComponent {
  constructor(
    @Inject(EMAIL_TEMPLATES_SERVICE_TOKEN)
    private emailTemplateService: DfBaseCrudService
  ) {}
}

import { Component } from '@angular/core';
import { javaScriptExampleLinks, nativeExampleLinks } from '../constants';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';

import { DfIconCardLinkComponent } from '../df-icon-card-link/df-icon-card-link.component';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-quickstart-page',
  templateUrl: './df-quickstart-page.component.html',
  styleUrls: ['./df-quickstart-page.component.scss'],
  standalone: true,
  imports: [
    MatDividerModule,
    NgFor,
    DfIconCardLinkComponent,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class DfQuickstartPageComponent {
  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;

  constructor(public breakpointService: DfBreakpointService) {}
}

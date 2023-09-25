import { Component, Input } from '@angular/core';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';

import { AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TranslocoPipe } from '@ngneat/transloco';

interface LinkInfo {
  name: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'df-icon-card-link',
  templateUrl: './df-icon-card-link.component.html',
  styleUrls: ['./df-icon-card-link.component.scss'],
  standalone: true,
  imports: [MatCardModule, AsyncPipe, TranslocoPipe],
})
export class DfIconCardLinkComponent {
  constructor(public breakpointService: DfBreakpointService) {}

  @Input() linkInfo: LinkInfo;
}

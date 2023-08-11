import { Component, Input } from '@angular/core';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

interface LinkInfo {
  name: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'df-icon-card-link',
  templateUrl: './df-icon-card-link.component.html',
  styleUrls: ['./df-icon-card-link.component.scss'],
})
export class DfIconCardLinkComponent {
  constructor(public breakpointService: DfBreakpointService) {}

  @Input() linkInfo: LinkInfo;
}

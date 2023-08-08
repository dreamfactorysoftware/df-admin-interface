import { Component, Input } from '@angular/core';

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
  @Input() linkInfo: LinkInfo;
}

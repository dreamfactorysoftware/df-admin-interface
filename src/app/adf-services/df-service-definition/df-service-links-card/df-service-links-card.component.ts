import { Component, Input } from '@angular/core';

interface ServiceLinkInfo {
  id: number;
  relatedRoles: any[]; //TODO: update this with role interface
}

@Component({
  selector: 'df-service-links-card',
  templateUrl: './df-service-links-card.component.html',
  styleUrls: ['./df-service-links-card.component.scss']
})
export class DfServiceLinksCardComponent {

  @Input() serviceInfo: ServiceLinkInfo;
}

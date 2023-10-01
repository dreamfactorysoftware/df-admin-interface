import { Component, Input } from '@angular/core';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';
import { NgIf } from '@angular/common';

interface LinkItem {
  name: string;
  icon: IconProp;
  link: string;
}

@Component({
  selector: 'df-icon-link',
  templateUrl: './df-icon-link.component.html',
  styleUrls: ['./df-icon-link.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, TranslocoDirective, TranslocoPipe, NgIf],
})
export class DfIconLinkComponent {
  @Input() linkItem: LinkItem;
}

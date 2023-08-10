import { Component, Input } from '@angular/core';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface LinkItem {
  name: string;
  icon: IconProp;
  link: string;
}

@Component({
  selector: 'df-icon-link',
  templateUrl: './df-icon-link.component.html',
  styleUrls: ['./df-icon-link.component.scss']
})
export class DfIconLinkComponent {

    @Input() linkItem: LinkItem;


}

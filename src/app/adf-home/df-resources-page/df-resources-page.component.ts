import { Component } from '@angular/core';
import { resourcesPageResources } from '../constants';

@Component({
  selector: 'df-resources-page',
  templateUrl: './df-resources-page.component.html',
  styleUrls: ['./df-resources-page.component.scss'],
})
export class DfResourcesPageComponent {

  resourcesPageResources = resourcesPageResources;
}

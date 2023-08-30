import { Component } from '@angular/core';
import { resourcesPageResources } from '../constants';

import { DfIconLinkComponent } from '../df-icon-link/df-icon-link.component';
import { NgFor } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-resources-page',
  templateUrl: './df-resources-page.component.html',
  styleUrls: ['./df-resources-page.component.scss'],
  standalone: true,
  imports: [NgFor, DfIconLinkComponent, TranslocoPipe],
})
export class DfResourcesPageComponent {
  resourcesPageResources = resourcesPageResources;
}

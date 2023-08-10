import { Component } from '@angular/core';
import { javaScriptExampleLinks, nativeExampleLinks } from '../constants';

@Component({
  selector: 'df-quickstart-page',
  templateUrl: './df-quickstart-page.component.html',
  styleUrls: ['./df-quickstart-page.component.scss'],
})
export class DfQuickstartPageComponent {
  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;
}

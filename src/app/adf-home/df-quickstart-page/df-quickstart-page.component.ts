import { Component } from '@angular/core';
import { javaScriptExampleLinks, nativeExampleLinks } from '../constants';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

@Component({
  selector: 'df-quickstart-page',
  templateUrl: './df-quickstart-page.component.html',
  styleUrls: ['./df-quickstart-page.component.scss'],
})
export class DfQuickstartPageComponent {

  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;

  isXSmall: boolean;

  constructor(private breakpointService: DfBreakpointService) {}

  ngOnInit(): void {
    this.breakpointService.isXSmallScreen.subscribe((isXSmall: boolean) => {
      this.isXSmall = isXSmall;
    });
  }
}

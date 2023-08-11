import { Component } from '@angular/core';
import {
  faCirclePlay,
  faComment,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';

import {
  javaScriptExampleLinks,
  nativeExampleLinks,
  welcomePageResources,
} from '../constants';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

@Component({
  selector: 'df-welcome-page',
  templateUrl: './df-welcome-page.component.html',
  styleUrls: ['./df-welcome-page.component.scss'],
})
export class DfWelcomePageComponent {
  faCirclePlay = faCirclePlay;
  faHeart = faHeart;
  faComment = faComment;

  welcomePageResources = welcomePageResources;
  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;

  isMobile: boolean;
  isXSmall: boolean;

  constructor(private breakpointService: DfBreakpointService) {}

  ngOnInit(): void {
    this.breakpointService.isSmallScreen.subscribe((isSmall: boolean) => {
      this.isMobile = isSmall;
    });

    this.breakpointService.isXSmallScreen.subscribe((isXSmall: boolean) => {
      this.isXSmall = isXSmall;
    });
  }
}

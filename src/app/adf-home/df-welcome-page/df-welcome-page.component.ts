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
}

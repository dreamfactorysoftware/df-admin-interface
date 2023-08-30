import { Component } from '@angular/core';

import {
  javaScriptExampleLinks,
  nativeExampleLinks,
  welcomePageResources,
} from '../constants';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

import { DfIconCardLinkComponent } from '../df-icon-card-link/df-icon-card-link.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { DfIconLinkComponent } from '../df-icon-link/df-icon-link.component';
import { NgFor, AsyncPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCirclePlay,
  faComment,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-welcome-page',
  templateUrl: './df-welcome-page.component.html',
  styleUrls: ['./df-welcome-page.component.scss'],
  standalone: true,
  imports: [
    FontAwesomeModule,
    NgFor,
    DfIconLinkComponent,
    MatCardModule,
    MatDividerModule,
    DfIconCardLinkComponent,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class DfWelcomePageComponent {
  faCirclePlay = faCirclePlay;
  faHeart = faHeart;
  faComment = faComment;

  welcomePageResources = welcomePageResources;
  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;

  constructor(public breakpointService: DfBreakpointService) {}
}

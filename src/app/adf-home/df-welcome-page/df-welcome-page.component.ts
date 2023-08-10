import { Component } from '@angular/core';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import {
  faBook,
  faBug,
  faCirclePlay,
  faComments,
  faFileLines,
  faLifeRing,
  faPenToSquare,
  faVideo,
} from '@fortawesome/free-solid-svg-icons';
import { javaScriptExampleLinks, nativeExampleLinks } from '../constants';

@Component({
  selector: 'df-welcome-page',
  templateUrl: './df-welcome-page.component.html',
  styleUrls: ['./df-welcome-page.component.scss'],
})
export class DfWelcomePageComponent {
  faCirclePlay = faCirclePlay;
  faFileLines = faFileLines;
  faVideo = faVideo;
  faBook = faBook;
  faComments = faComments;
  faBug = faBug;
  faTwitter = faTwitter;
  faPenToSquare = faPenToSquare;
  faLifeRing = faLifeRing;

  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;

  welcomeResources = [
    {
      name: 'Getting Started Guide',
      icon: faFileLines,
      link: 'https://guide.dreamfactory.com',
    },
    {
      name: 'Video Tutorials',
      icon: faVideo,
      link: 'https://wiki.dreamfactory.com/DreamFactory/Videos',
    },
    {
      name: 'Full Documentation',
      icon: faBook,
      link: 'https://wiki.dreamfactory.com/',
    },
    {
      name: 'Community Forum',
      icon: faComments,
      link: 'http://community.dreamfactory.com/',
    },
    {
      name: 'Bugs and Feature Requests',
      icon: faBug,
      link: 'https://github.com/dreamfactorysoftware/dreamfactory/issues',
    },
    {
      name: 'DreamFactory on Twitter',
      icon: faTwitter,
      link: 'https://twitter.com/dfsoftwareinc',
    },
    {
      name: 'DreamFactory Blog',
      icon: faPenToSquare,
      link: 'https://blog.dreamfactory.com/',
    },
    {
      name: 'Contact Support',
      icon: faLifeRing,
      link: 'https://www.dreamfactory.com/support',
    },
  ];
}

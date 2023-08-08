import { Component } from '@angular/core';

@Component({
  selector: 'df-welcome-page',
  templateUrl: './df-welcome-page.component.html',
  styleUrls: ['./df-welcome-page.component.scss'],
})
export class WelcomePageComponent {
  welcomeResources = [
    {
      name: 'Getting Started Guide',
      icon: 'description',
      link: 'https://guide.dreamfactory.com',
    },
    {
      name: 'Video Tutorials',
      icon: 'videocam',
      link: 'https://wiki.dreamfactory.com/DreamFactory/Videos',
    },
    {
      name: 'Full Documentation',
      icon: 'library_books',
      link: 'https://wiki.dreamfactory.com/',
    },
    {
      name: 'Community Forum',
      icon: 'question_answer',
      link: 'http://community.dreamfactory.com/',
    },
    {
      name: 'Bugs and Feature Requests',
      icon: 'pest_control',
      link: 'https://github.com/dreamfactorysoftware/dreamfactory/issues',
    },
    {
      name: 'DreamFactory on Twitter',
      icon: 'close',
      link: 'https://twitter.com/dfsoftwareinc',
    },
    {
      name: 'DreamFactory Blog',
      icon: 'history_edu',
      link: 'https://blog.dreamfactory.com/',
    },
    {
      name: 'Contact Support',
      icon: 'contact_support',
      link: 'https://www.dreamfactory.com/support',
    },
  ];

  nativeExampleLinks = [
    {
      name: 'Objective-C',
      url: 'https://github.com/dreamfactorysoftware/ios-sdk',
      icon: 'in_product_apple_lil.png',
    },
    {
      name: 'Apple Swift',
      url: 'https://github.com/dreamfactorysoftware/ios-swift-sdk',
      icon: 'in_product_swift_lil.png',
    },
    {
      name: 'Android Java',
      url: 'https://github.com/dreamfactorysoftware/android-sdk',
      icon: 'in_product_android_lil.png',
    },
    {
      name: 'Microsoft .NET',
      url: 'https://github.com/dreamfactorysoftware/.net-sdk',
      icon: 'in_product_dotnet_lil.png',
    },
  ];

  javaScriptExampleLinks = [
    {
      name: 'JavaScript',
      url: 'https://github.com/dreamfactorysoftware/javascript-sdk',
      icon: 'in_product_javascript_lil.png',
    },
    {
      name: 'Ionic',
      url: 'https://github.com/dreamfactorysoftware/ionic-sdk',
      icon: 'in_product_ionic_lil.png',
    },
    {
      name: 'Titanium',
      url: 'https://github.com/dreamfactorysoftware/titanium-sdk',
      icon: 'in_product_titanium_lil.png',
    },
    {
      name: 'AngularJS',
      url: 'https://github.com/dreamfactorysoftware/angular-sdk',
      icon: 'in_product_angular_lil.svg',
    },
    {
      name: 'Angular 2',
      url: 'https://github.com/dreamfactorysoftware/angular2-sdk',
      icon: 'in_product_angular2_lil.png',
    },
    {
      name: 'React',
      url: 'https://github.com/dreamfactorysoftware/reactjs-sdk',
      icon: 'in_product_reactjs_lil.png',
    },
  ];
}

import { Component } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'df-app-home',
  template: '<h1>{{ "home.welcome" | transloco }}</h1>',
  standalone: true,
  imports: [TranslocoModule],
})
export class HomeComponent {}

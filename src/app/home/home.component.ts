import { Component } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-home',
  template: '<h1>{{ "home.welcome" | transloco }}</h1>',
  standalone: true,
  imports: [TranslocoModule]
})
export class HomeComponent {}
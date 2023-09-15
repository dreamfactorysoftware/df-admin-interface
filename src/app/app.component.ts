import { Component } from '@angular/core';
import { DfLoadingSpinnerService } from './core/services/df-loading-spinner.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DfSideNavComponent } from './shared/components/df-side-nav/df-side-nav.component';
@Component({
  selector: 'df-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [DfSideNavComponent, RouterOutlet, NgIf, AsyncPipe],
})
export class AppComponent {
  title = 'df-admin-interface';
  activeSpinner$ = this.loadingSpinnerService.active;
  constructor(private loadingSpinnerService: DfLoadingSpinnerService) {}
}

import { Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfThemeService } from '../../services/df-theme.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'df-theme-toggle',
  templateUrl: './df-theme-toggle.component.html',
  // styleUrls: ['./df-theme-toggle.component.scss'],
  standalone: true,
  imports: [MatSlideToggleModule],
})
export class DfThemeToggleComponent {
  isDarkMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  themeService = inject(DfThemeService);

  toggle() {
    this.isDarkMode$.subscribe(isDarkMode => {
      this.themeService.setThemeMode(!isDarkMode);
    });
    this.isDarkMode$.next(!this.isDarkMode$.value);
  }
}

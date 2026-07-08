import { Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfThemeService } from '../../services/df-theme.service';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'df-theme-toggle',
  templateUrl: './df-theme-toggle.component.html',
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .phosphor-toggle {
        font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        min-width: 30px;
        height: 30px;
        padding: 0 6px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--df-text-muted);
        cursor: pointer;
      }
      .phosphor-toggle:hover {
        border-color: var(--df-border);
        color: var(--df-text);
      }
      :host-context(.phosphor-theme) .phosphor-toggle {
        color: #33ff66;
        border-color: rgba(51, 255, 102, 0.4);
        text-shadow: 0 0 5px rgba(51, 255, 102, 0.5);
      }
    `,
  ],
  standalone: true,
  imports: [MatSlideToggleModule, AsyncPipe],
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

  togglePhosphor() {
    this.themeService.setPhosphorMode(!this.themeService.phosphor$.value);
  }
}

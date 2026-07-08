import { Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfThemeService } from '../../services/df-theme.service';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';
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
  private transloco = inject(TranslocoService);

  toggle() {
    this.isDarkMode$.subscribe(isDarkMode => {
      this.themeService.setThemeMode(!isDarkMode);
    });
    this.isDarkMode$.next(!this.isDarkMode$.value);
  }

  togglePhosphor() {
    const turningOn = !this.themeService.phosphor$.value;
    this.themeService.setPhosphorMode(turningOn);
    // Boot ceremony fires ONLY on the live toggle-ON action, never on
    // load (loadInitialTheme applies the class silently). Toggle-off is
    // silent by design.
    if (turningOn) {
      this.playBootSequence();
    }
  }

  /**
   * Spawns a lightweight full-screen phosphor boot overlay: CRT flicker,
   * then "SHALL WE PLAY A GAME?" types out in VT323, then the overlay fades
   * and the themed UI shows through. All styling lives in styles.scss
   * (.phosphor-boot*) and rides phosphor tokens. Skippable on any
   * click/keypress; honors prefers-reduced-motion.
   */
  private playBootSequence(): void {
    if (typeof document === 'undefined' || document.querySelector('.phosphor-boot')) {
      return;
    }
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resolved = this.transloco.translate('phosphor.boot');
    const text =
      resolved && resolved !== 'phosphor.boot'
        ? resolved
        : 'SHALL WE PLAY A GAME?';

    const overlay = document.createElement('div');
    overlay.className = 'phosphor-boot';
    const scanline = document.createElement('div');
    scanline.className = 'phosphor-boot__scanline';
    const line = document.createElement('div');
    line.className = 'phosphor-boot__line';
    line.textContent = text;
    // Drive the type-out length from the resolved string so the animation
    // matches whatever phosphor.boot resolves to.
    line.style.setProperty('--boot-w', `${text.length}ch`);
    if (!reduce) {
      line.style.animation =
        `phosphor-boot-type 0.9s steps(${text.length}, end) 0.4s forwards, ` +
        `phosphor-boot-caret 0.6s step-end 0.4s 4`;
    }
    overlay.appendChild(scanline);
    overlay.appendChild(line);
    document.body.appendChild(overlay);

    let torndown = false;
    const skip = () => teardown();
    const teardown = () => {
      if (torndown) {
        return;
      }
      torndown = true;
      window.removeEventListener('click', skip, true);
      window.removeEventListener('keydown', skip, true);
      overlay.classList.add('phosphor-boot--out');
      window.setTimeout(() => overlay.remove(), 320);
    };

    // Attach skip listeners on the next frame so the very click that
    // toggled phosphor does not instantly dismiss the ceremony.
    const attach = () => {
      if (torndown) {
        return;
      }
      window.addEventListener('click', skip, true);
      window.addEventListener('keydown', skip, true);
    };
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(attach);
    } else {
      window.setTimeout(attach, 0);
    }

    // Auto-finish: reduced motion clears fast, full sequence after the
    // flicker + type-out settles (~1.4s).
    window.setTimeout(teardown, reduce ? 450 : 1500);
  }
}

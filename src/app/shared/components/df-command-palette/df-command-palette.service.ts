import { Injectable, inject } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Router } from '@angular/router';
import { DfCommandPaletteComponent } from './df-command-palette.component';

/**
 * Owns the single Cmd/Ctrl-K overlay so the app shell only has to call
 * toggle(). Keeps overlay wiring out of the shell and guarantees one palette
 * instance at a time.
 */
@Injectable({ providedIn: 'root' })
export class DfCommandPaletteService {
  private overlay = inject(Overlay);
  private router = inject(Router);
  private ref?: OverlayRef;

  toggle(): void {
    if (this.ref) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.ref) {
      return;
    }
    const positionStrategy = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .top('12vh');

    const ref = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      // Default CDK dark backdrop (already themed by the prebuilt overlay CSS
      // that MatDialog relies on) so no global stylesheet edit is needed.
      hasBackdrop: true,
      panelClass: 'df-palette-panel',
      disposeOnNavigation: true,
    });
    this.ref = ref;

    const portal = new ComponentPortal(DfCommandPaletteComponent);
    const componentRef = ref.attach(portal);
    componentRef.instance.overlayRef = ref;
    componentRef.instance.currentUrl = this.router.url;

    ref.backdropClick().subscribe(() => this.close());
    ref.detachments().subscribe(() => {
      this.ref = undefined;
    });
  }

  close(): void {
    this.ref?.dispose();
    this.ref = undefined;
  }
}

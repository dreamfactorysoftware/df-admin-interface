import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PopupComponent } from './df-popup.component';
import { POPUP_CONFIG, PopupConfig } from './popup-config';

@Injectable({ providedIn: 'root' })
export class PopupOverlayService {
  private overlayRef: OverlayRef | null = null;

  constructor(private overlay: Overlay, private injector: Injector) {}

  open(config?: PopupConfig) {
    if (this.overlayRef) return; // Prevent multiple overlays
    const injector = Injector.create({
      providers: [
        { provide: POPUP_CONFIG, useValue: config }
      ],
      parent: this.injector
    });
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'popup-backdrop',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
    const portal = new ComponentPortal(PopupComponent, null, injector);
    this.overlayRef.attach(portal);
    this.overlayRef.backdropClick().subscribe(() => this.close());
  }

  close() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
} 
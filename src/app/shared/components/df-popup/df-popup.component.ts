import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslocoPipe } from '@ngneat/transloco';
import { Router } from '@angular/router';
import { ROUTES } from '../../types/routes';
import { PopupOverlayService } from './popup-overlay.service';
import { DfAuthService } from 'src/app/adf-user-management/services/df-auth.service';
import { POPUP_CONFIG, PopupConfig } from './popup-config';

@Component({
  selector: 'df-popup',
  templateUrl: './df-popup.component.html',
  standalone: true,
  styleUrls: ['./df-popup.component.scss'],
  imports: [CommonModule, MatButtonModule, MatDialogModule, TranslocoPipe],
})
export class PopupComponent {
  constructor(
    private router: Router,
    private popupOverlay: PopupOverlayService,
    private authService: DfAuthService,
    @Optional() @Inject(POPUP_CONFIG) public config: PopupConfig
  ) {}

  get message() {
    return (
      this.config?.message ||
      'Your current password is shorter than recommended (less than 17 characters). For better security, we recommend updating your password to a longer one.'
    );
  }
  get showRemindMeLater() {
    return this.config?.showRemindMeLater !== false;
  }

  closePopup(shouldRedirect = false) {
    this.popupOverlay.close();
    if (shouldRedirect) {
      this.authService.logout();
      this.router.navigate([ROUTES.AUTH, ROUTES.RESET_PASSWORD]);
    }
  }
}

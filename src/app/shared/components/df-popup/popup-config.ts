import { InjectionToken } from '@angular/core';

export interface PopupConfig {
  message: string;
  showRemindMeLater: boolean;
}

export const POPUP_CONFIG = new InjectionToken<PopupConfig>('POPUP_CONFIG'); 
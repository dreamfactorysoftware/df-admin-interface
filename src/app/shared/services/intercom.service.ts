import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { DfUserDataService } from './df-user-data.service';

// Declare Intercom on window for shutdown/update operations

@Injectable({
  providedIn: 'root',
})
export class IntercomService {
  private intercomLoaded = false;

  constructor(private dfUserDataService: DfUserDataService) {}

  async initializeIntercom(): Promise<void> {
    // Check if Intercom should be enabled based on environment config
    if (!environment.intercomWidget) {
      console.log('Intercom widget is disabled via environment configuration');
      return;
    }

    // Check if Intercom is already loaded
    if (this.intercomLoaded) {
      return;
    }

    // Dynamically import the Intercom SDK
    try {
      const IntercomModule = await import('@intercom/messenger-js-sdk');
      const Intercom = IntercomModule.default;

      // Get current user data
      const userData = this.dfUserDataService.userData;

      if (userData) {
        // Initialize Intercom with user data
        Intercom({
          app_id: environment.intercomAppId || 'ymvqkyiw',
          user_id: userData.id?.toString() || userData.sessionId,
          name:
            userData.name ||
            `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email,
          created_at: userData.lastLoginDate
            ? Math.floor(new Date(userData.lastLoginDate).getTime() / 1000)
            : undefined,
          custom_attributes: {
            is_sys_admin: userData.isSysAdmin,
            is_root_admin: userData.isRootAdmin,
            role_id: userData.roleId,
            instance_url: window.location.origin,
          },
        });

        this.intercomLoaded = true;
        console.log('Intercom widget initialized successfully');
      } else {
        // Initialize Intercom for non-logged-in users (visitor mode)
        Intercom({
          app_id: environment.intercomAppId || 'ymvqkyiw',
        });

        this.intercomLoaded = true;
        console.log('Intercom widget initialized in visitor mode');
      }
    } catch (error) {
      console.error('Failed to initialize Intercom:', error);
    }
  }

  hideIntercom(): void {
    if ((window as any).Intercom && this.intercomLoaded) {
      (window as any).Intercom('hide');
    }
  }

  showIntercom(): void {
    if ((window as any).Intercom && this.intercomLoaded) {
      (window as any).Intercom('show');
    }
  }

  shutdownIntercom(): void {
    if ((window as any).Intercom && this.intercomLoaded) {
      (window as any).Intercom('shutdown');
      this.intercomLoaded = false;
    }
  }

  updateUser(userData: any): void {
    if (
      !environment.intercomWidget ||
      !(window as any).Intercom ||
      !this.intercomLoaded
    ) {
      return;
    }

    if (userData) {
      (window as any).Intercom('update', {
        user_id: userData.id?.toString() || userData.sessionId,
        name:
          userData.name ||
          `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email,
        created_at: userData.lastLoginDate
          ? Math.floor(new Date(userData.lastLoginDate).getTime() / 1000)
          : undefined,
        custom_attributes: {
          is_sys_admin: userData.isSysAdmin,
          is_root_admin: userData.isRootAdmin,
          role_id: userData.roleId,
          instance_url: window.location.origin,
        },
      });
    }
  }
}

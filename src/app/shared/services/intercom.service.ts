import { Injectable } from '@angular/core';
import { DfUserDataService } from './df-user-data.service';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { DfIntercomConfigService } from '../../adf-config/df-intercom/df-intercom-config.service';

// Declare Intercom on window for shutdown/update operations

@Injectable({
  providedIn: 'root',
})
export class IntercomService {
  private intercomLoaded = false;

  constructor(
    private dfUserDataService: DfUserDataService,
    private dfSystemConfigDataService: DfSystemConfigDataService,
    private dfIntercomConfigService: DfIntercomConfigService
  ) {}

  async initializeIntercom(): Promise<void> {
    // Check if Intercom should be enabled based on API config
    const apiConfig = this.dfIntercomConfigService.currentConfig;
    const intercomEnabled = apiConfig.intercomWidget ?? true; // Default to true if no config exists

    if (!intercomEnabled) {
      console.log('Intercom widget is disabled via configuration');
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
      const systemEnvironment = this.dfSystemConfigDataService.environment;

      if (userData) {
        // Initialize Intercom with user data
        Intercom({
          app_id: apiConfig.intercomAppId || 'ymvqkyiw',
          user_id: userData.id?.toString() || userData.sessionId,
          name:
            userData.name ||
            `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email,
          created_at: userData.lastLoginDate
            ? Math.floor(new Date(userData.lastLoginDate).getTime() / 1000)
            : undefined,
          is_sys_admin: userData.isSysAdmin,
          is_root_admin: userData.isRootAdmin,
          role_id: userData.roleId,
          instance_url: window.location.origin,
          license_key: systemEnvironment.platform?.licenseKey || 'N/A',
          DreamFactoryTier: systemEnvironment.platform?.license || 'N/A',
          'DreamFactory version': systemEnvironment.platform?.version || 'N/A',
          plan: systemEnvironment.platform?.license || 'N/A',
          is_hosted: systemEnvironment.platform?.isHosted || false,
          is_trial: systemEnvironment.platform?.isTrial || false,
        });

        this.intercomLoaded = true;
        console.log('Intercom widget initialized successfully');
      } else {
        // Initialize Intercom for non-logged-in users (visitor mode)
        Intercom({
          app_id: apiConfig.intercomAppId || 'ymvqkyiw',
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
    const apiConfig = this.dfIntercomConfigService.currentConfig;
    const intercomEnabled = apiConfig.intercomWidget ?? true; // Default to true if no config exists

    if (!intercomEnabled || !(window as any).Intercom || !this.intercomLoaded) {
      return;
    }

    const systemEnvironment = this.dfSystemConfigDataService.environment;

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
        is_sys_admin: userData.isSysAdmin,
        is_root_admin: userData.isRootAdmin,
        role_id: userData.roleId,
        instance_url: window.location.origin,
        license_key: systemEnvironment.platform?.licenseKey || 'N/A',
        DreamFactoryTier: systemEnvironment.platform?.license || 'N/A',
        'DreamFactory version': systemEnvironment.platform?.version || 'N/A',
        plan: systemEnvironment.platform?.license || 'N/A',
        is_hosted: systemEnvironment.platform?.isHosted || false,
        is_trial: systemEnvironment.platform?.isTrial || false,
      });
    }
  }
}

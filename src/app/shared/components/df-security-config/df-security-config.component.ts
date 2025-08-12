import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DfCelebrationDialogComponent } from '../df-celebration-dialog/df-celebration-dialog.component';
import { DfSystemService } from 'src/app/shared/services/df-system.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { switchMap, catchError, map } from 'rxjs';
import { throwError } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faPen, faLockOpen } from '@fortawesome/free-solid-svg-icons';

interface AccessOption {
  key: string;
  label: string;
  description: string;
  selected: boolean;
  level: 'read' | 'write' | 'full';
}

interface SecurityConfigData {
  accessType: string;
  accessLevel: string;
  component: string;
}

@Component({
  selector: 'df-security-config',
  standalone: true,
  templateUrl: './df-security-config.component.html',
  styleUrls: ['./df-security-config.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    FontAwesomeModule,
  ],
})
export class DfSecurityConfigComponent implements OnInit {
  @Input() serviceName: string = '';
  @Input() serviceId: number | null = null;
  @Input() isDatabase: boolean = false;
  @Input() isFirstTimeUser: boolean = false;

  @Output() goBack = new EventEmitter<void>();

  // FontAwesome icons
  faEye = faEye;
  faPen = faPen;
  faLockOpen = faLockOpen;

  // Multiple security configurations
  securityConfigurations: SecurityConfigData[] = [];

  // Access options for the component design
  accessOptions: AccessOption[] = [];

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private systemService: DfSystemService,
    private snackbarService: DfSnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeAccessOptions();
  }

  private initializeAccessOptions(): void {
    this.accessOptions = [
      {
        key: 'fullAccess',
        label: 'Full Access',
        description: 'Grant complete access to all database components',
        selected: false,
        level: 'read',
      },
      {
        key: 'schemaAccess',
        label: 'Schema Access',
        description: 'Configure access to specific database schemas',
        selected: false,
        level: 'read',
      },
      {
        key: 'tableAccess',
        label: 'Table Access',
        description: 'Manage access to individual database tables',
        selected: false,
        level: 'read',
      },
      {
        key: 'storedProcedures',
        label: 'Stored Procedures',
        description: 'Control access to stored procedures',
        selected: false,
        level: 'read',
      },
      {
        key: 'functions',
        label: 'Functions',
        description: 'Set access levels for database functions',
        selected: false,
        level: 'read',
      },
    ];
  }

  // Original component methods
  toggleCard(option: AccessOption): void {
    // Special handling for full access
    if (option.key === 'fullAccess') {
      if (!option.selected) {
        // When selecting full access, unselect all other options
        this.accessOptions.forEach(opt => {
          if (opt.key !== 'fullAccess' && opt.selected) {
            opt.selected = false;
            this.removeSecurityConfiguration(opt.key);
          }
        });
      }
    } else {
      // For other options, if full access is selected, unselect it first
      const fullAccessOption = this.accessOptions.find(
        opt => opt.key === 'fullAccess'
      );
      if (fullAccessOption && fullAccessOption.selected) {
        fullAccessOption.selected = false;
        this.removeSecurityConfiguration(fullAccessOption.key);
      }
    }

    option.selected = !option.selected;

    // Update the security configuration based on the selected option
    if (option.selected) {
      // Add new configuration
      this.addSecurityConfiguration(option);
    } else {
      // Remove configuration for this option
      this.removeSecurityConfiguration(option.key);
    }
  }

  private addSecurityConfiguration(option: AccessOption): void {
    // Map the access option key to the corresponding access type
    let accessType = '';
    let component = '';

    switch (option.key) {
      case 'fullAccess':
        accessType = 'all';
        component = '*';
        break;
      case 'schemaAccess':
        accessType = 'schema';
        component = '_schema/*';
        break;
      case 'tableAccess':
        accessType = 'tables';
        component = '_table/*';
        break;
      case 'storedProcedures':
        accessType = 'procedures';
        component = '_proc/*';
        break;
      case 'functions':
        accessType = 'functions';
        component = '_func/*';
        break;
    }

    // Create new security configuration
    const newConfig: SecurityConfigData = {
      accessType: accessType,
      accessLevel: option.level,
      component: component,
    };

    // Add to configurations array
    this.securityConfigurations.push(newConfig);

    console.log('Added security configuration:', newConfig);
    console.log('All configurations:', this.securityConfigurations);
  }

  private removeSecurityConfiguration(optionKey: string): void {
    // Find and remove the configuration for this option
    const index = this.securityConfigurations.findIndex(config => {
      switch (optionKey) {
        case 'fullAccess':
          return config.accessType === 'all';
        case 'schemaAccess':
          return config.accessType === 'schema';
        case 'tableAccess':
          return config.accessType === 'tables';
        case 'storedProcedures':
          return config.accessType === 'procedures';
        case 'functions':
          return config.accessType === 'functions';
        default:
          return false;
      }
    });

    if (index !== -1) {
      const removed = this.securityConfigurations.splice(index, 1)[0];
      console.log('Removed security configuration:', removed);
      console.log('Remaining configurations:', this.securityConfigurations);
    }
  }

  onAccessLevelChange(
    option: AccessOption,
    level: 'read' | 'write' | 'full'
  ): void {
    option.level = level;

    // Update the corresponding configuration in the array
    const configIndex = this.securityConfigurations.findIndex(config => {
      switch (option.key) {
        case 'fullAccess':
          return config.accessType === 'all';
        case 'schemaAccess':
          return config.accessType === 'schema';
        case 'tableAccess':
          return config.accessType === 'tables';
        case 'storedProcedures':
          return config.accessType === 'procedures';
        case 'functions':
          return config.accessType === 'functions';
        default:
          return false;
      }
    });

    if (configIndex !== -1) {
      this.securityConfigurations[configIndex].accessLevel = level;
      console.log(
        'Updated access level for configuration:',
        this.securityConfigurations[configIndex]
      );
    }
  }

  handleGoBack(): void {
    console.log('Back button clicked');
    this.goBack.emit();
  }

  isSecurityConfigValid(): boolean {
    // Check if at least one option is selected
    const hasSelectedOption = this.accessOptions.some(opt => opt.selected);

    if (!hasSelectedOption) {
      return false;
    }

    // Check if we have configurations
    if (this.securityConfigurations.length === 0) {
      return false;
    }

    // Validate each configuration
    for (const config of this.securityConfigurations) {
      if (!config.accessType || !config.accessLevel || !config.component) {
        return false;
      }

      // Additional validation based on access type
      if (config.accessType === 'all') {
        if (config.component !== '*') {
          return false;
        }
      } else {
        // For other access types, ensure component has wildcard
        if (!config.component.includes('/*')) {
          return false;
        }
      }
    }

    return true;
  }

  saveSecurityConfig() {
    if (!this.isSecurityConfigValid()) {
      this.snackbarService.openSnackBar(
        'Please select at least one access option and ensure all required fields are filled',
        'error'
      );
      return;
    }

    if (!this.serviceId) {
      this.snackBar.open('No service ID found. Please try again.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formattedName = this.formatServiceName(this.serviceName);
    const roleName = `${this.serviceName}_auto_role`;

    // Create role service access entries for each configuration
    const roleServiceAccessEntries = this.securityConfigurations.map(
      config => ({
        service_id: this.serviceId,
        component: config.component,
        verb_mask: this.getAccessLevel(config.accessLevel),
        requestor_mask: 3,
        filters: [],
        filter_op: 'AND',
      })
    );

    const rolePayload = {
      resource: [
        {
          name: roleName,
          description: `Auto-generated role for service ${this.serviceName}`,
          is_active: true,
          role_service_access_by_role_id: roleServiceAccessEntries,
          user_to_app_to_role_by_role_id: [],
        },
      ],
    };

    console.log('Creating role with multiple configurations:', rolePayload);

    // Create role and chain with app creation using proper RxJS operators
    this.systemService
      .post('role', rolePayload)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        }),
        switchMap((roleResponse: any) => {
          if (!roleResponse?.resource?.[0]?.id) {
            return throwError(() => new Error('Invalid role response'));
          }
          const createdRoleId = roleResponse.resource[0].id;

          const appPayload = {
            resource: [
              {
                name: `${this.serviceName}_app`,
                description: `Auto-generated app for service ${this.serviceName}`,
                type: '0',
                role_id: createdRoleId,
                is_active: true,
                url: null,
                storage_service_id: null,
                storage_container: null,
                path: null,
              },
            ],
          };

          return this.systemService
            .post('app?fields=*&related=role_by_role_id', appPayload)
            .pipe(
              catchError(error => {
                this.snackBar.open(
                  `Error creating app: ${
                    error.error?.message || error.message || 'Unknown error'
                  }`,
                  'Close',
                  { duration: 5000 }
                );
                return throwError(() => error);
              }),
              map((appResponse: any) => {
                if (!appResponse?.resource?.[0]) {
                  throw new Error('App response missing resource array');
                }

                const app = appResponse.resource[0];

                if (!app.apiKey) {
                  throw new Error('App response missing apiKey');
                }

                return {
                  apiKey: app.apiKey,
                  formattedName: formattedName,
                };
              }),
              catchError(error => {
                return throwError(() => error);
              })
            );
        }),
        map((appResponse: any) => {
          if (!appResponse?.apiKey) {
            throw new Error('Invalid app response');
          }
          return {
            apiKey: appResponse.apiKey,
            formattedName: formattedName,
          };
        })
      )
      .subscribe({
        next: result => {
          // Attempt to copy API key to clipboard
          if (navigator.clipboard) {
            navigator.clipboard
              .writeText(result.apiKey)
              .then(() => {
                this.snackbarService.openSnackBar(
                  `API Created with ${this.securityConfigurations.length} security configuration(s) and API Key copied to clipboard`,
                  'success'
                );
              })
              .catch(() => {
                this.snackbarService.openSnackBar(
                  `API Created with ${this.securityConfigurations.length} security configuration(s), but failed to copy API Key`,
                  'success'
                );
              });
          } else {
            this.snackbarService.openSnackBar(
              `API Created with ${this.securityConfigurations.length} security configuration(s), but failed to copy API Key`,
              'success'
            );
          }

          // Check if this is first-time user and show celebration
          if (this.isFirstTimeUser && this.isDatabase) {
            // Show celebration dialog for first-time users
            const dialogRef = this.dialog.open(DfCelebrationDialogComponent, {
              width: '550px',
              maxWidth: '90vw',
              disableClose: true,
              panelClass: 'celebration-dialog-container',
              data: {
                serviceName: result.formattedName,
                apiKey: result.apiKey,
                isFirstTime: true,
              },
            });
            
            // Dialog will handle navigation to API docs when closed
          } else {
            // Navigate to API docs directly for experienced users
            this.router
              .navigateByUrl(
                `/api-connections/api-docs/${result.formattedName}`,
                {
                  replaceUrl: true,
                }
              )
              .then(success => {
                if (!success) {
                  this.router.navigate(
                    ['api-connections', 'api-docs', result.formattedName],
                    {
                      replaceUrl: true,
                    }
                  );
                }
              });
          }
        },
        error: error => {
          // Show error message using DfSnackbarService
          this.snackbarService.openSnackBar(
            'Error saving security configuration',
            'error'
          );
        },
      });
  }

  private getAccessLevel(level: string): number {
    switch (level) {
      case 'read':
        return 1; // GET
      case 'write':
        return 7; // GET (1) + POST (2) + PUT/PATCH (4) = 7
      case 'full':
        return 15; // All permissions (GET + POST + PUT + DELETE)
      default:
        return 0;
    }
  }

  private formatServiceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_-]/g, '');
  }
}

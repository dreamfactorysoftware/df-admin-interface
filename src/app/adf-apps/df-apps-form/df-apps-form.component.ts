import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DfAppsService } from '../services/df-apps.service';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { AppPayload, AppType } from '../types/df-apps.types';

@Component({
  selector: 'df-apps-form',
  templateUrl: './df-apps-form.component.html',
  styleUrls: ['./df-apps-form.component.scss'],
})
export class DfAppsFormComponent implements OnInit {
  @ViewChild('rolesInput') rolesInput: ElementRef<HTMLInputElement>;
  private destroyed$ = new Subject<void>();
  appForm: FormGroup;
  roles: any[] = [];
  filteredRoles: any[] = [];
  editApp: AppType;
  urlOrigin: string;
  faCopy = faCopy;

  constructor(
    private fb: FormBuilder,
    private appsService: DfAppsService,
    private activatedRoute: ActivatedRoute
  ) {
    this.urlOrigin = window.location.origin;

    this.appForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      defaultRole: [null], // TODO get role name instead of id
      active: [false],
      appLocation: ['0'], // "type" property
      storageServiceId: [3], // type 2
      storageContainer: ['applications'], // type 2
      path: [''], // type 1, 2,
      url: [''], // type 2
    });
  }

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.roles = data?.roles?.resource || [];
        this.filteredRoles = data?.roles?.resource || [];
        this.editApp = data?.appData || null;
      });

    if (this.editApp) {
      this.appForm.patchValue({
        name: this.editApp.name,
        description: this.editApp.description,
        defaultRole: this.editApp.roleByRoleId,
        active: this.editApp.isActive,
        appLocation: `${this.editApp.type}`,
        storageServiceId: this.editApp.storageServiceId, // TODO fix ui not updating with default value
        storageContainer: this.editApp.storageContainer,
        path: this.editApp.path,
        url: this.editApp.url,
      });
    }

    this.appForm.controls['storageServiceId'].updateValueAndValidity();
  }

  filter(): void {
    const filterValue = this.rolesInput.nativeElement.value.toLowerCase();
    this.filteredRoles = this.roles.filter(o =>
      o.name.toLowerCase().includes(filterValue)
    );
  }

  displayFn(role: any): string {
    return role && role.name ? role.name : '';
  }

  getAppLocationUrl(): string {
    return `${this.urlOrigin}/
    ${
      this.appForm.value.appLocation === '1' &&
      this.appForm.value.storageServiceId === 3
        ? 'file/'
        : ''
    }
    ${
      this.appForm.value.appLocation === '1' &&
      this.appForm.value.storageServiceId === 4
        ? 'log/'
        : ''
    }
    ${
      this.appForm.value.appLocation === '1'
        ? this.appForm.value.storageContainer + '/'
        : ''
    }
    ${this.appForm.value.path}`.replaceAll(/\s/g, '');
  }

  copyAppUrl() {
    const url = this.getAppLocationUrl();
    navigator.clipboard
      .writeText(url)
      .then()
      .catch(error => console.error('Failed to copy to clipboard:', error));
  }

  onSubmit() {
    const payload: AppPayload = {
      name: this.appForm.value.name,
      description: this.appForm.value.description,
      type: parseInt(this.appForm.value.appLocation),
      role_id: this.appForm.value.defaultRole.id,
      is_active: this.appForm.value.active,
      url:
        this.appForm.value.appLocation === '2' ? this.appForm.value.url : null,
      storage_service_id:
        this.appForm.value.appLocation === '1'
          ? this.appForm.value.storageServiceId
          : null,
      storage_container:
        this.appForm.value.appLocation === '1'
          ? this.appForm.value.storageContainer
          : null,
      path:
        this.appForm.value.appLocation === '1' ||
        this.appForm.value.appLocation === '3'
          ? this.appForm.value.path
          : null,
    };
    if (this.editApp) {
      this.appsService.editApp({ ...payload, id: this.editApp.id });
    } else {
      this.appsService.createApp(payload);
    }
  }
}

// role_by_role_id:
interface RoleType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  roleServiceAccessByRoleId: any[];
  lookupByRoleId: any[];
}

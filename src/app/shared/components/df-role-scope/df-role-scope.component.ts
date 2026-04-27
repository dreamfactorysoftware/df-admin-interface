import {
  Component,
  Inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faXmark,
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ROLE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { Service } from 'src/app/shared/types/service';

interface RoleScopeAccessRow {
  id: number;
  roleId: number;
  serviceId: number;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters?: unknown[];
  filterOp?: string;
}

interface RoleScopeRoleResponse {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  roleServiceAccessByRoleId: RoleScopeAccessRow[];
}

interface ScopeServiceEntry {
  service: Service;
  rules: Array<{
    component: string;
    verbs: string[];
    requesters: string[];
  }>;
}

const VERB_LABELS: Array<{ mask: number; label: string }> = [
  { mask: 1, label: 'GET' },
  { mask: 2, label: 'POST' },
  { mask: 4, label: 'PUT' },
  { mask: 8, label: 'PATCH' },
  { mask: 16, label: 'DELETE' },
];

const REQUESTER_LABELS: Array<{ mask: number; label: string }> = [
  { mask: 1, label: 'API' },
  { mask: 2, label: 'SCRIPT' },
];

@Component({
  selector: 'df-role-scope',
  templateUrl: './df-role-scope.component.html',
  styleUrls: ['./df-role-scope.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    FontAwesomeModule,
    MatProgressSpinnerModule,
  ],
})
export class DfRoleScopeComponent implements OnChanges {
  @Input() roleId?: number | null;
  @Input() showDeniedServices = true;
  @Input() compact = false;

  loading = false;
  error: string | null = null;
  roleName = '';
  roleDescription = '';

  allowedServices: ScopeServiceEntry[] = [];
  deniedServices: Service[] = [];
  expandedDenied = false;

  faCheck = faCheck;
  faXmark = faXmark;
  faChevronDown = faChevronDown;
  faChevronRight = faChevronRight;

  constructor(
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('roleId' in changes) {
      this.load();
    }
  }

  toggleDenied(): void {
    this.expandedDenied = !this.expandedDenied;
  }

  trackByServiceId(_: number, entry: ScopeServiceEntry): number {
    return entry.service.id;
  }

  trackByDeniedId(_: number, service: Service): number {
    return service.id;
  }

  private load(): void {
    this.error = null;
    this.allowedServices = [];
    this.deniedServices = [];
    this.roleName = '';
    this.roleDescription = '';

    if (this.roleId == null) {
      return;
    }

    this.loading = true;

    forkJoin({
      role: this.roleService
        .get<RoleScopeRoleResponse>(this.roleId, {
          related: 'role_service_access_by_role_id',
        })
        .pipe(catchError(() => of(null))),
      services: this.servicesService
        .getAll<GenericListResponse<Service>>({
          limit: 0,
          sort: 'name',
        })
        .pipe(catchError(() => of(null))),
    }).subscribe(({ role, services }) => {
      this.loading = false;

      if (!role) {
        this.error = 'Unable to load role.';
        return;
      }
      if (!services) {
        this.error = 'Unable to load service catalog.';
        return;
      }

      this.roleName = role.name;
      this.roleDescription = role.description ?? '';

      this.buildScope(role, services.resource ?? []);
    });
  }

  private buildScope(
    role: RoleScopeRoleResponse,
    services: Service[]
  ): void {
    const accessRows = role.roleServiceAccessByRoleId ?? [];
    const serviceById = new Map<number, Service>();
    services.forEach(s => serviceById.set(s.id, s));

    const grouped = new Map<number, ScopeServiceEntry>();

    for (const row of accessRows) {
      const svc = serviceById.get(row.serviceId);
      if (!svc) {
        continue;
      }
      let entry = grouped.get(row.serviceId);
      if (!entry) {
        entry = { service: svc, rules: [] };
        grouped.set(row.serviceId, entry);
      }
      entry.rules.push({
        component: row.component || '*',
        verbs: this.decodeMask(row.verbMask, VERB_LABELS),
        requesters: this.decodeMask(row.requestorMask, REQUESTER_LABELS),
      });
    }

    this.allowedServices = Array.from(grouped.values()).sort((a, b) =>
      a.service.name.localeCompare(b.service.name)
    );

    if (this.showDeniedServices) {
      this.deniedServices = services
        .filter(s => !grouped.has(s.id))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  private decodeMask(
    mask: number,
    labels: Array<{ mask: number; label: string }>
  ): string[] {
    return labels.filter(l => (mask & l.mask) === l.mask).map(l => l.label);
  }
}

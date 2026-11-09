import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ROUTES } from 'src/app/shared/types/routes';
import { JsonValidator } from 'src/app/shared/validators/json.validator';
import {
  APP_SERVICE_TOKEN,
  BASE_SERVICE_TOKEN,
  SCHEDULER_SERVICE_TOKEN,
  USER_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import {
  CreateSchedulePayload,
  RunStatus,
  SchedulerTaskData,
  TaskRun,
  UpdateSchedulePayload,
} from '../../shared/types/scheduler';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  NgIf,
  NgFor,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  NgTemplateOutlet,
  AsyncPipe,
  DatePipe,
} from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RunPhase, durationSeconds, runPhase } from '../utils/run-status';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Service } from 'src/app/shared/types/service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';
import { DfVerbPickerComponent } from 'src/app/shared/components/df-verb-picker/df-verb-picker.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  AlertType,
  DfAlertComponent,
} from 'src/app/shared/components/df-alert/df-alert.component';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import {
  applyServerErrorsToForm,
  normalizeError,
} from 'src/app/shared/utilities/app-error';

import { Subscription, catchError, throwError } from 'rxjs';

/** One Run history row, precomputed so the template calls no functions. */
export type RunRow = TaskRun & { phase: RunPhase; duration: number | null };

/** Position of the Run history tab: Basic (0), Run history (1), Log. */
const RUN_HISTORY_TAB_INDEX = 1;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-scheduler',
  templateUrl: './df-scheduler-details.component.html',
  styleUrls: ['./df-scheduler-details.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatInputModule,
    MatTabsModule,
    MatPaginatorModule,
    DatePipe,
    MatSelectModule,
    MatSlideToggleModule,
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    NgTemplateOutlet,
    TranslocoPipe,
    ReactiveFormsModule,
    DfAceEditorComponent,
    DfVerbPickerComponent,
    DfAlertComponent,
  ],
})
export class DfSchedulerDetailsComponent implements OnInit {
  formGroup: FormGroup; // basic form
  userServicesDropdownOptions: Service[];
  selectedService: Service | undefined;

  relatedParam = 'task_log_by_task_id';

  componentDropdownOptions: string[] = [];

  trackById = (_: number, item: { id: number }): number => item.id;
  trackByValue = (_: number, item: string): string => item;

  scheduleToEdit: SchedulerTaskData | undefined;
  // Optional "run as" identity dropdowns.
  runAsApps: Array<{ id: number; name: string }> = [];
  runAsUsers: Array<{ id: number; name: string; email?: string }> = [];
  log = '';
  // Run history tab (df-scheduler#41). Optional backend feature: only a
  // df-scheduler that keeps per-run history appends run_status to a task.
  // Without it the tab is hidden and nothing extra is requested, so the page
  // behaves exactly as it did before the feature existed.
  runsSupported = false;
  runStatus: RunStatus | undefined;
  // Loaded on first open of the tab, not with the page: up to 100 runs with
  // their output is too much to fetch for a tab that may never be opened.
  runsState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  runsError = '';
  private runsRequest?: Subscription;
  // The tab group keeps its selected tab when the router reuses this
  // component for another task, so the open tab is tracked here.
  private tabIndex = 0;
  // Newest first, paged client-side; output stays collapsed.
  runs: RunRow[] = [];
  // Memoized page slice: a getter here would hand *ngFor a new array on
  // every change detection.
  pagedRuns: RunRow[] = [];
  runPage = 0;
  readonly runPageSize = 10;
  expandedRuns = new Set<number>();
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';

  constructor(
    @Inject(SCHEDULER_SERVICE_TOKEN)
    private service: DfBaseCrudService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(BASE_SERVICE_TOKEN)
    private accessListService: DfBaseCrudService,
    @Inject(APP_SERVICE_TOKEN)
    private appService: DfBaseCrudService,
    @Inject(USER_SERVICE_TOKEN)
    private userService: DfBaseCrudService,
    private themeService: DfThemeService
  ) {}

  isDarkMode = this.themeService.darkMode$;

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      active: [true, Validators.required],
      serviceId: ['', Validators.required],
      component: ['', Validators.required],
      method: ['GET', Validators.required],
      frequency: [],
      appId: [null],
      userId: [null],
    });
    this.activatedRoute.data.subscribe((data: any) => {
      this.userServicesDropdownOptions = data.data.resource;
    });

    // Populate the optional "run as" identity dropdowns.
    this.appService
      .getAll<GenericListResponse<{ id: number; name: string }>>({
        fields: 'id,name',
        limit: 1000,
        sort: 'name',
      })
      .subscribe(res => (this.runAsApps = res.resource));
    this.userService
      .getAll<
        GenericListResponse<{ id: number; name: string; email: string }>
      >({ fields: 'id,name,email', limit: 1000, sort: 'name' })
      .subscribe(res => (this.runAsUsers = res.resource));

    this.activatedRoute.data.subscribe((data: any) => {
      this.scheduleToEdit = data.schedulerObject;

      if (this.scheduleToEdit) {
        this.log = this.scheduleToEdit.taskLogByTaskId?.content ?? '';
        this.runStatus = this.scheduleToEdit.runStatus ?? undefined;
        this.runsSupported = !!this.runStatus;
        // A response still in flight belongs to the previous task.
        this.runsRequest?.unsubscribe();
        this.runsState = 'idle';
        this.runsError = '';
        this.expandedRuns.clear();
        this.setRuns([]);
        // Arriving from another task with the Run history tab already open:
        // no tab change will fire, so load now.
        this.loadRunsIfShown();

        this.getServiceAccessList(this.scheduleToEdit.serviceId as number);

        this.formGroup.setValue({
          name: this.scheduleToEdit.name,
          description: this.scheduleToEdit.description,
          active: this.scheduleToEdit.isActive,
          serviceId: this.scheduleToEdit.serviceId,
          component: this.scheduleToEdit.component,
          method: this.scheduleToEdit.verb,
          frequency: this.scheduleToEdit.frequency,
          appId: this.scheduleToEdit.appId ?? null,
          userId: this.scheduleToEdit.userId ?? null,
        });

        if (this.scheduleToEdit.verb !== 'GET') {
          this.addPayloadField(this.scheduleToEdit.payload as string);
        }
      }
    });

    this.formGroup.get('method')?.valueChanges.subscribe(data => {
      if (data === 'GET') this.removePayloadField();
      else if (!this.formGroup.contains('payload')) this.addPayloadField();
    });

    this.formGroup.get('serviceId')?.valueChanges.subscribe(data => {
      this.getServiceAccessList(data);
    });

    // The "run as user" field is hidden (*ngIf) when no app is selected, but
    // hiding it does not clear its control. Without this, picking an app + user
    // and then setting the app back to "None" submits a userId with no appId —
    // an identity shape the backend does not support.
    this.formGroup.get('appId')?.valueChanges.subscribe(appId => {
      if (!appId) this.formGroup.get('userId')?.setValue(null);
    });
  }

  onTabIndexChange(index: number) {
    this.tabIndex = index;
    this.loadRunsIfShown();
  }

  private loadRunsIfShown() {
    if (
      this.runsSupported &&
      this.tabIndex === RUN_HISTORY_TAB_INDEX &&
      this.runsState === 'idle'
    ) {
      this.loadRuns();
    }
  }

  /** Fetch the task's runs. Failures show in the tab; the form is untouched. */
  loadRuns() {
    if (!this.scheduleToEdit) return;
    this.runsState = 'loading';
    this.runsRequest?.unsubscribe();
    this.runsRequest = this.service
      .get<SchedulerTaskData>(this.scheduleToEdit.id, {
        related: 'task_run_by_task_id',
        errorHandling: 'toast-off',
      })
      .subscribe({
        next: task => {
          // Fresher than the resolver's copy: decides which open row is the
          // run in progress.
          this.runStatus = task.runStatus ?? this.runStatus;
          this.setRuns(task.taskRunByTaskId ?? []);
          this.runsState = 'loaded';
        },
        error: err => {
          this.runsError = normalizeError(err).message;
          this.runsState = 'error';
        },
      });
  }

  private setRuns(runs: TaskRun[]) {
    this.runs = [...runs]
      .sort((a, b) => b.id - a.id)
      .map(run => ({
        ...run,
        phase: runPhase(run, this.runStatus),
        duration: durationSeconds(run),
      }));
    this.runPage = 0;
    this.updatePagedRuns();
  }

  private updatePagedRuns() {
    const start = this.runPage * this.runPageSize;
    this.pagedRuns = this.runs.slice(start, start + this.runPageSize);
  }

  onRunPage(e: PageEvent) {
    this.runPage = e.pageIndex;
    this.updatePagedRuns();
  }

  toggleRun(id: number) {
    if (!this.expandedRuns.delete(id)) this.expandedRuns.add(id);
  }

  triggerAlert(type: AlertType, msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }

  onCancel() {
    this.router.navigate([ROUTES.SYSTEM_SETTINGS, ROUTES.SCHEDULER]);
  }

  onSubmit() {
    if (this.formGroup.invalid || this.formGroup.pristine) return;

    if (typeof this.scheduleToEdit === 'undefined') {
      const payload = this.assemblePayload() as CreateSchedulePayload;

      this.service
        .create(
          { resource: [payload] },
          {
            snackbarSuccess: 'scheduler.alerts.createdSuccess',
            fields: '*',
            related: this.relatedParam,
          }
        )
        .pipe(
          catchError(err => {
            this.showServerErrors(err);
            return throwError(() => normalizeError(err));
          })
        )
        .subscribe(() =>
          this.router.navigate([ROUTES.SYSTEM_SETTINGS, ROUTES.SCHEDULER])
        );
    } else if (this.scheduleToEdit) {
      const payload = this.assemblePayload() as UpdateSchedulePayload;

      this.service
        .update(this.scheduleToEdit.id, payload, {
          snackbarSuccess: 'scheduler.alerts.updateSuccess',
          fields: '*',
          related: this.relatedParam,
        })
        .pipe(
          catchError(err => {
            this.triggerAlert('error', normalizeError(err).message);
            return throwError(() => normalizeError(err));
          })
        )
        .subscribe(() =>
          this.router.navigate([ROUTES.SYSTEM_SETTINGS, ROUTES.SCHEDULER])
        );
    }
  }

  /** Map server validation errors onto controls; banner shows whatever
   * could not be mapped (all messages, not just the first). */
  private showServerErrors(err: unknown) {
    const e = normalizeError(err);
    const leftovers = applyServerErrorsToForm(this.formGroup, e);
    if (leftovers.length || !e.fields.length) {
      this.triggerAlert(
        'error',
        leftovers.length ? leftovers.join('\n') : e.message
      );
    }
  }

  addPayloadField(payloadInput?: string) {
    this.formGroup.addControl(
      'payload',
      this.formBuilder.control(payloadInput ?? '', [JsonValidator])
    );
  }

  removePayloadField() {
    this.formGroup.removeControl('payload');
  }

  private getServiceAccessList(serviceId: number) {
    const service = this.userServicesDropdownOptions.find(val => {
      return val.id === serviceId;
    });
    this.selectedService = service;

    if (service) {
      this.accessListService
        .get<GenericListResponse<string>>(service.name, {
          additionalParams: [
            {
              key: 'as_access_list',
              value: true,
            },
          ],
        })

        .subscribe(data => {
          this.componentDropdownOptions = data.resource;
        });
    }
  }

  private getVerbMask(verb: string): number {
    switch (verb) {
      case 'GET':
        return 1;

      case 'POST':
        return 2;

      case 'PUT':
        return 4;

      case 'PATCH':
        return 8;

      case 'DELETE':
        return 16;
      default:
        return 1;
    }
  }

  private assemblePayload():
    | UpdateSchedulePayload
    | CreateSchedulePayload
    | null {
    if (this.selectedService) {
      const payload = {
        component: this.formGroup.value.component,
        description: this.formGroup.value.description,
        frequency: this.formGroup.value.frequency,
        isActive: this.formGroup.value.active,
        name: this.formGroup.value.name,
        payload: this.formGroup.value.payload ?? null,
        serviceId: this.formGroup.value.serviceId,
        serviceName: this.selectedService.name,
        appId: this.formGroup.value.appId ?? null,
        userId: this.formGroup.value.userId ?? null,
        verb: this.formGroup.value.method,
        service: {
          id: this.formGroup.value.serviceId,
          name: this.selectedService.name,
          label: this.selectedService.label,
          description: this.selectedService.description,
          type: this.selectedService.type,
          components: this.componentDropdownOptions,
        },
        verbMask: this.getVerbMask(this.formGroup.value.method),
      };

      if (this.scheduleToEdit) {
        return {
          lastModifiedDate: this.scheduleToEdit.lastModifiedDate as string,
          lastModifiedById: this.scheduleToEdit.lastModifiedById as number,
          hasLog: !!this.scheduleToEdit.taskLogByTaskId,
          createdDate: this.scheduleToEdit.createdDate as string,
          createdById: this.scheduleToEdit.createdById as number,
          id: this.scheduleToEdit.id,
          ...payload,
        } as UpdateSchedulePayload;
      }

      return { ...payload, id: null } as CreateSchedulePayload;
    }

    return null;
  }
}

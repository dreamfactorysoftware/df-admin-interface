import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DfScriptSamplesComponent } from '../df-script-samples/df-script-samples.component';
import {
  CdkMenuGroup,
  CdkMenu,
  CdkMenuTrigger,
  CdkMenuItem,
  CdkMenuBar,
} from '@angular/cdk/menu';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import {
  BASE_SERVICE_TOKEN,
  EVENT_SCRIPT_SERVICE_TOKEN,
  SCRIPTS_SERVICE_TOKEN,
} from 'src/app/core/constants/tokens';
import { ActivatedRoute } from '@angular/router';
import { Service } from 'src/app/shared/types/service';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import {
  GithubFileObject,
  ScriptDetailsType,
  ScriptObject,
  ScriptType,
} from '../types/df-scripts.types';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { camelCase, snakeCase } from 'lodash';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfScriptsGithubDialogComponent } from '../df-scripts-github-dialog/df-scripts-github-dialog.component';

@Component({
  selector: 'df-scripts',
  templateUrl: './df-scripts.component.html',
  styleUrls: ['./df-scripts.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatTabsModule,
    MatSelectModule,
    MatSlideToggleModule,
    DfScriptSamplesComponent,
    DfAceEditorComponent,
    CdkMenuGroup,
    CdkMenu,
    CdkMenuTrigger,
    CdkMenuItem,
    CdkMenuBar,
    NgIf,
    NgFor,
    AsyncPipe,
    TranslocoPipe,
    ReactiveFormsModule,
  ],
})
export class DfScriptsComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  userServices: Service[];
  scriptTypes: ScriptType[];
  selectedService: Service;
  selectedServiceDetails: ScriptDetailsType;
  selectedServiceAttributes: any; // TODO: update type
  selectedServiceAttributeKey: string;
  serviceKeys: string[] = [];
  serviceEndpoints: string[] = [];
  explodedEndpoints: string[] = [];
  selectedEndpoint: string | null;
  confirmedEndpoint: string | null;
  isDropdownFormVisible = true;
  editScriptMode = false;
  scriptToEdit: ScriptObject | null;
  githubFileObject: GithubFileObject;
  fileServiceDropdownOptions: Partial<Service>[] = [];
  selectedFileService: Partial<Service> | undefined;

  dropDownOptionsFormGroup: FormGroup;
  scriptFormGroup: FormGroup;

  constructor(
    @Inject(SCRIPTS_SERVICE_TOKEN) private scriptService: DfBaseCrudService,
    @Inject(EVENT_SCRIPT_SERVICE_TOKEN)
    private eventScriptService: DfBaseCrudService,
    @Inject(BASE_SERVICE_TOKEN)
    private baseService: DfBaseCrudService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public dialog: MatDialog
  ) {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.userServices = data.data.resource;
        this.scriptTypes = data.scriptType.resource;
      });

    this.dropDownOptionsFormGroup = this.formBuilder.group({
      selectedService: [],
      serviceKeys: [{ value: '', disabled: true }],
      serviceEndpoint: [{ value: '', disabled: true }],
      confirmedServiceEndpoint: [{ value: '', disabled: true }],
    });

    this.scriptFormGroup = this.formBuilder.group({
      name: [{ value: this.confirmedEndpoint, disabled: true }],
      type: [this.scriptTypes[0]],
      content: [''],
      isActive: [false],
      allowEventModification: [false],
      storageServiceId: [null],
      scmRepository: [null], // TODO: update these any types to an appropriate type
      scmReference: [null],
      storagePath: [null],
    });
  }

  ngOnInit(): void {
    const baseParams = ['source+control', 'file'];
    this.baseService
      .get('', {
        additionalParams: [
          {
            key: 'group',
            value: baseParams.join(','),
          },
        ],
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.fileServiceDropdownOptions = data.services;
      });

    this.scriptFormGroup.controls['storageServiceId'].valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe((id: number) => {
        this.selectedFileService = this.fileServiceDropdownOptions.find(val => {
          return val.id === id;
        });
        console.log('file service: ', this.selectedFileService);
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onLinkToServiceSelectionChange(event: any) {
    console.log('event selection: ', event);
  }

  getAcceptedFileTypes(): string {
    const selectedScriptType = this.scriptFormGroup.controls['type']
      .value as ScriptType;
    switch (selectedScriptType.name) {
      case 'nodejs':
        return '.js, application/json';

      case 'php':
        return '.php';

      case 'python':
      case 'python3':
        return '.py';

      default:
        return '.js, application/json, .py, .php'; //TODO: update to correct values
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(DfScriptsGithubDialogComponent);

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(res => {
        if (res) {
          this.githubFileObject = res.data;
          this.scriptFormGroup.patchValue({
            content: window.atob(this.githubFileObject['content']),
          });
        }
      });
  }

  onSave() {
    const payload = {
      // TODO: remove the commented code below

      // name: this.scriptFormGroup.controls['name'].value,
      // type: this.scriptFormGroup.controls['type'].value,
      // isActive: this.scriptFormGroup.controls['isActive'].value,
      // allowEventModification:
      //   this.scriptFormGroup.controls['allowEventModification'].value,
      // content: this.scriptFormGroup.controls['content'].value,
      ...this.scriptFormGroup.value,
      // scmReference: null,
      // scmRepository: null,
      // storagePath: null,
      // storageServiceId: null,
    } as ScriptObject;

    if (this.scriptFormGroup.valid) {
      if (this.editScriptMode) {
        // update script here
        this.eventScriptService
          .update(
            payload.name,
            {
              ...payload,
              config: this.scriptToEdit?.config,
              createdById: this.scriptToEdit?.createdById,
              createdDate: this.scriptToEdit?.createdDate,
              lastModifiedById: this.scriptToEdit?.lastModifiedById,
              lastModifiedDate: this.scriptToEdit?.lastModifiedDate,
            },
            {
              snackbarError: 'server',
              snackbarSuccess: 'Script successfully updated', // TODO: add translation key here
            }
          )
          .pipe(takeUntil(this.destroyed$))
          .subscribe();
      } else {
        this.eventScriptService
          .create(
            {
              resource: [payload],
            },
            {
              snackbarError: 'server',
              snackbarSuccess: 'Script successfully created', // TODO: add translation key here
            }
          )
          .pipe(takeUntil(this.destroyed$))
          .subscribe();
      }
    }
  }

  onBack() {
    this.editScriptMode = false;
    this.isDropdownFormVisible = true;
    this.confirmedEndpoint = null;

    this.scriptFormGroup.patchValue({
      type: this.scriptTypes[0],
      content: '',
      isActive: false,
      allowEventModification: false,
    });
  }

  onDelete() {
    if (this.scriptToEdit) {
      this.eventScriptService
        .delete(this.scriptToEdit.name)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.onBack();
        });
    }
  }

  pullLatestScript() {}

  deleteScriptFromCache() {
    this.baseService
      .delete(`system/cache/_event/${this.confirmedEndpoint}`)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(response => {
        console.log('onDeleteScriptFromCache response: ', response);
      });
  }

  onDesktopUploadScriptFile = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const text = await file?.text();
    this.scriptFormGroup.patchValue({
      content: text,
    });
  };

  onConfirmServiceEndpointClick(confirmedEndpoint: string) {
    this.confirmedEndpoint = confirmedEndpoint;
    this.scriptFormGroup.patchValue({ name: this.confirmedEndpoint });

    this.eventScriptService
      .get(this.confirmedEndpoint)
      .pipe(
        takeUntil(this.destroyed$),
        catchError(err => {
          this.editScriptMode = false;
          return throwError(() => new Error(err));
        })
      )
      .subscribe((data: any) => {
        this.editScriptMode = true;
        this.scriptToEdit = data;

        this.scriptFormGroup.patchValue({
          type: data.type,
          isActive: data.isActive,
          content: data.content,
        });
      });

    this.isDropdownFormVisible = false;
  }

  onServiceEndpointClick(endpoint: string) {
    this.selectedEndpoint = endpoint;

    this.explodedEndpoints = [endpoint];

    if (
      this.selectedServiceAttributes[this.selectedServiceAttributeKey]
        .parameter !== null
    ) {
      const parameterObject =
        this.selectedServiceAttributes[this.selectedServiceAttributeKey]
          .parameter;

      const paramObjectKeys = Object.keys(parameterObject);

      const parameters: string[] = [];

      paramObjectKeys.forEach(paramObjectKey => {
        parameters.push(...parameterObject[paramObjectKey]);
      });

      if (endpoint.indexOf('{') >= 0 && endpoint.indexOf('}') >= 0) {
        paramObjectKeys.forEach(paramObjectKey => {
          parameters.forEach(param => {
            this.explodedEndpoints.push(
              endpoint.replace('{' + snakeCase(paramObjectKey) + '}', param)
            );
          });
        });
      }
    }

    this.dropDownOptionsFormGroup.controls['confirmedServiceEndpoint'].enable();
  }

  onServiceKeyClick(key: string) {
    this.selectedServiceAttributeKey = key;

    this.dropDownOptionsFormGroup.controls['serviceEndpoint'].enable();

    this.serviceEndpoints = this.selectedServiceAttributes[key].endpoints;
  }

  onSelectServiceClick(service: Service) {
    this.selectedService = service;

    this.scriptService
      .getAll({
        additionalParams: [
          {
            key: 'scriptable',
            value: true,
          },
          {
            key: 'service',
            value: service.name,
          },
        ],
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        // enable 2nd dropdown
        this.dropDownOptionsFormGroup.controls['serviceKeys'].enable();

        this.selectedServiceDetails = data;
        const camel = camelCase(this.selectedService.name);
        this.selectedServiceAttributes = this.selectedServiceDetails[camel];
        this.serviceKeys = Object.keys(this.selectedServiceAttributes);
      });
  }
}

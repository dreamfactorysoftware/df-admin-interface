import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DfScriptSamplesComponent } from '../df-script-samples/df-script-samples.component';
import {
  CdkMenuGroup,
  CdkMenu,
  CdkMenuTrigger,
  CdkMenuItem,
  CdkMenuBar,
} from '@angular/cdk/menu';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import {
  BASE_SERVICE_TOKEN,
  EVENT_SCRIPT_SERVICE_TOKEN,
  SCRIPTS_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfScriptsGithubDialogComponent } from '../df-scripts-github-dialog/df-scripts-github-dialog.component';
import { KeyValuePair } from 'src/app/shared/types/generic-http.type';
import { mapCamelToSnake } from 'src/app/shared/utilities/case';

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
  selectedServiceAttributes: any;
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

  @ViewChild('fileInput') fileInput: ElementRef;

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
      scmRepository: [null],
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
      });

    this.scriptFormGroup.controls['type'].valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(val => {
        const fileType = this.getAcceptedFileTypes(val);
        this.fileInput.nativeElement.accept = fileType;
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  getAcceptedFileTypes(fileType: string): string {
    switch (fileType) {
      case 'nodejs':
        return '.js, application/json';

      case 'php':
        return '.php';

      case 'python':
      case 'python3':
        return '.py';

      default:
        return '.js, application/json';
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
      name: this.scriptFormGroup.controls['name'].value,
      type: this.scriptFormGroup.controls['type'].value,
      isActive: this.scriptFormGroup.controls['isActive'].value,
      allowEventModification:
        this.scriptFormGroup.controls['allowEventModification'].value,
      content: this.scriptFormGroup.controls['content'].value,
      scmReference: this.scriptFormGroup.controls['scmReference'].value,
      scmRepository: this.scriptFormGroup.controls['scmRepository'].value,
      storagePath: this.scriptFormGroup.controls['storagePath'].value,
      storageServiceId: this.scriptFormGroup.controls['storageServiceId'].value,
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
              snackbarSuccess: 'scripts.updateSuccessMsg',
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
              snackbarSuccess: 'scripts.createSuccessMsg',
            }
          )
          .pipe(takeUntil(this.destroyed$))
          .subscribe(() => {
            if (this.confirmedEndpoint) {
              this.fetchScript(this.confirmedEndpoint);
            }
          });
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
        .delete(this.scriptToEdit.name, {
          snackbarError: 'server',
          snackbarSuccess: 'scripts.deleteSuccessMsg',
        })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.onBack();
        });
    }
  }

  pullLatestScript() {
    const serviceName = this.scriptFormGroup.controls['name'];
    const serviceRepo = this.scriptFormGroup.controls['scmRepository'];
    const serviceRef = this.scriptFormGroup.controls['scmReference'];
    const servicePath = this.scriptFormGroup.controls['storagePath'];
    let endpoint = '/' + serviceName;

    let params: KeyValuePair[] = [];

    if (
      this.selectedFileService &&
      (this.selectedFileService.type === 'github' ||
        this.selectedFileService.type === 'gitlab' ||
        this.selectedFileService.type === 'bitbucket')
    ) {
      params = [
        {
          key: 'path',
          value: servicePath,
        },
        { key: 'branch', value: serviceRef },
        { key: 'content', value: 1 },
      ];
      endpoint = endpoint + '/_repo/' + serviceRepo;
    } else {
      endpoint = endpoint + '/' + servicePath;
    }

    this.baseService
      .get(endpoint, {
        additionalParams: [...params],
        snackbarError: 'server',
        snackbarSuccess: 'scripts.fetchCacheSuccessMsg',
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.scriptFormGroup.patchValue({
          content: data,
        });
      });
  }

  deleteScriptFromCache() {
    this.baseService
      .delete(`system/cache/_event/${this.confirmedEndpoint}`, {
        snackbarError: 'server',
        snackbarSuccess: 'scripts.deleteCacheSuccessMsg',
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
  }

  onDesktopUploadScriptFile = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const text = await file?.text();
    this.scriptFormGroup.patchValue({
      content: text,
    });
  };

  private fetchScript(endpoint: string) {
    this.eventScriptService
      .get(endpoint)
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
          allowEventModification: data.allowEventModification,
          storageServiceId: data.storageServiceId,
          scmRepository: data.scmRepository,
          scmReference: data.scmReference,
          storagePath: data.storagePath,
        });
      });
  }

  onConfirmServiceEndpointClick(confirmedEndpoint: string) {
    this.confirmedEndpoint = confirmedEndpoint;
    this.scriptFormGroup.patchValue({ name: this.confirmedEndpoint });

    // fetching if script exists, if it does the form is populated
    this.fetchScript(this.confirmedEndpoint);

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
              endpoint.replace('{' + paramObjectKey + '}', param)
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

    // fetch all endpoints for selected service
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

        this.selectedServiceDetails = mapCamelToSnake(data); // adapting the keys here to be in their normal state (snakecase) as interceptor changes all requests to camelcase
        this.selectedServiceAttributes =
          this.selectedServiceDetails[this.selectedService.name];
        this.serviceKeys = Object.keys(this.selectedServiceAttributes);
      });
  }
}

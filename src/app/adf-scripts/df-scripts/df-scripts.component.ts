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
import { SCRIPTS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { ActivatedRoute } from '@angular/router';
import { Service } from 'src/app/shared/types/service';
import { Subject, takeUntil } from 'rxjs';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import { ScriptDetailsType, ScriptType } from '../types/df-scripts.types';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { camelCase, snakeCase } from 'lodash';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'df-scripts',
  templateUrl: './df-scripts.component.html',
  styleUrls: ['./df-scripts.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatTabsModule,
    MatSelectModule,
    MatSlideToggleModule,
    DfScriptSamplesComponent,
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
  serviceEndpointsToConfirm: string[] = []; // endpoints that may/may not contain inserted parameters
  selectedEndpoint: string | null;
  confirmedEndpoint: string | null;

  dropDownOptionsFormGroup: FormGroup;
  scriptFormGroup: FormGroup;

  constructor(
    @Inject(SCRIPTS_SERVICE_TOKEN) private scriptService: DfBaseCrudService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder
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
    });
  }

  ngOnInit(): void {
    // TODO: add the value changes subscriptions to dropdowns here
    console.log();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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
        return 'application/json';
    }
  }

  onDesktopUploadScriptFile(event: Event) {
    console.log('desktop upload event: ', event);
  }

  onGithubUploadScriptFile(event: Event) {
    console.log('github upload event: ', event);
  }

  onConfirmServiceEndpointClick(confirmedEndpoint: string) {
    console.log('confirm endpoint selected: ', confirmedEndpoint);
    this.confirmedEndpoint = confirmedEndpoint;
  }

  onServiceEndpointClick(endpoint: string) {
    console.log('endpoint selected: ', endpoint);
    this.selectedEndpoint = endpoint;

    this.serviceEndpointsToConfirm = [endpoint];

    if (
      this.selectedServiceAttributes[this.selectedServiceAttributeKey]
        .parameter !== null
    ) {
      // loop through parameters and insert endpoint then insert parameter-interpolated endpoint strings into the selectedEndpoint str then insert into 'serviceEndpointsToConfirm' array
      //const parameterName;

      const parameterObject =
        this.selectedServiceAttributes[this.selectedServiceAttributeKey]
          .parameter;

      const paramObjectKeys = Object.keys(parameterObject);
      console.log('key for parameters object: ', paramObjectKeys);

      const parameters: string[] = [];

      paramObjectKeys.forEach(paramObjectKey => {
        parameters.push(...parameterObject[paramObjectKey]);
      });

      console.log('parameters: ', parameters);

      if (endpoint.indexOf('{') >= 0 && endpoint.indexOf('}') >= 0) {
        paramObjectKeys.forEach(paramObjectKey => {
          parameters.forEach(param => {
            this.serviceEndpointsToConfirm.push(
              endpoint.replace('{' + snakeCase(paramObjectKey) + '}', param)
            );
          });
        });
      }

      console.log(
        'endpoint list for last dropdown: ',
        this.serviceEndpointsToConfirm
      );
    }

    this.dropDownOptionsFormGroup.controls['confirmedServiceEndpoint'].enable();
  }

  onServiceKeyClick(key: string) {
    console.log('key: ', key);
    this.selectedServiceAttributeKey = key;

    this.dropDownOptionsFormGroup.controls['serviceEndpoint'].enable();

    this.serviceEndpoints = this.selectedServiceAttributes[key].endpoints;
    console.log('selectedServiceEndpoints:', this.serviceEndpoints);
  }

  onSelectServiceClick(service: Service) {
    console.log('service: ', service.name);
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
        console.log('entire obj: ', this.selectedServiceDetails);
        const camel = camelCase(this.selectedService.name);
        console.log('selectedService name (key): ', camel);
        this.selectedServiceAttributes = this.selectedServiceDetails[camel];
        console.log('obj children: ', this.selectedServiceAttributes);
        this.serviceKeys = Object.keys(this.selectedServiceAttributes);
        console.log('obj children keys: ', this.serviceKeys);
      });
  }
}

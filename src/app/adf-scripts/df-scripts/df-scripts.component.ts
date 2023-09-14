import { Component, Inject } from '@angular/core';
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
import { camelCase } from 'lodash';

@Component({
  selector: 'df-scripts',
  templateUrl: './df-scripts.component.html',
  styleUrls: ['./df-scripts.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatTabsModule,
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
  ],
})
export class DfScriptsComponent {
  destroyed$ = new Subject<void>();
  userServices: Service[];
  scriptTypes: ScriptType[];
  selectedService: Service;
  selectedServiceDetails: ScriptDetailsType;
  selectedServiceAttributes: any; // TODO: update type
  selectedServiceKeys: string[] = [];
  selectedServiceEndpoints: string[] = [];
  keysVisible = false;

  constructor(
    @Inject(SCRIPTS_SERVICE_TOKEN) private scriptService: DfBaseCrudService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.userServices = data.data.resource;
        this.scriptTypes = data.scriptType.resource;
      });
  }

  onServiceEndpointClick(endpoint: string) {
    console.log('endpoint selected: ', endpoint);
  }

  onServiceKeyClick(key: string) {
    console.log('key: ', key);

    this.selectedServiceEndpoints =
      this.selectedServiceAttributes[key].endpoints;
    console.log('selectedServiceEndpoints:', this.selectedServiceEndpoints);
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
        this.selectedServiceDetails = data;
        console.log('entire obj: ', this.selectedServiceDetails);
        const camel = camelCase(this.selectedService.name);
        console.log('selectedService name (key): ', camel);
        this.selectedServiceAttributes = this.selectedServiceDetails[camel];
        console.log('obj children: ', this.selectedServiceAttributes);
        this.selectedServiceKeys = Object.keys(this.selectedServiceAttributes);
        console.log('obj children keys: ', this.selectedServiceKeys);
        this.keysVisible = true;
      });
  }
}

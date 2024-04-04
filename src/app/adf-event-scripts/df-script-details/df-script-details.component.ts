import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@ngneat/transloco';
import { ScriptEvent, ScriptObject } from 'src/app/shared/types/scripts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AsyncPipe, NgFor } from '@angular/common';
import { SCRIPT_TYPES } from 'src/app/shared/constants/scripts';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DfScriptEditorComponent } from 'src/app/shared/components/df-script-editor/df-script-editor.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { Observable, map, startWith } from 'rxjs';
import { groupEvents } from 'src/app/shared/utilities/eventScripts';
import {
  BASE_SERVICE_TOKEN,
  EVENTS_SERVICE_TOKEN,
  EVENT_SCRIPT_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { Service, ServiceType } from 'src/app/shared/types/service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-script-details',
  templateUrl: './df-script-details.component.html',
  standalone: true,
  imports: [
    DfAceEditorComponent,
    MatSlideToggleModule,
    TranslocoPipe,
    MatFormFieldModule,
    MatSelectModule,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    DfScriptEditorComponent,
    MatAutocompleteModule,
    MatInputModule,
    AsyncPipe,
  ],
})
export class DfScriptDetailsComponent implements OnInit {
  scriptDetails: ScriptObject;
  types = SCRIPT_TYPES;
  scriptForm: FormGroup;
  type: 'create' | 'edit' = 'create';
  scriptEvents: Array<ScriptEvent>;
  scriptEventsOptions: Observable<Array<ScriptEvent>>;
  loaded = false;
  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    @Inject(EVENT_SCRIPT_SERVICE_TOKEN)
    @Inject(EVENTS_SERVICE_TOKEN)
    // private eventScriptService: DfBaseCrudService,
    // eventScriptService: DfBaseCrudService,
    @Inject(BASE_SERVICE_TOKEN) private baseService: DfBaseCrudService
  ) {
    this.scriptForm = this.fb.group({
      name: ['', [Validators.required]],
      type: ['nodejs', [Validators.required]],
      content: [''],
      storageServiceId: [],
      storagePath: [''],
      isActive: [false],
    });
    this.baseService
      .getAll<{
        serviceTypes: Array<ServiceType>;
        services: Array<Service>;
      }>({
        additionalParams: [
          {
            key: 'group',
            value:
              'Database, Big Data, Script, Remote Service, File, Excel, Cache, Email, Notification, Log, Source Control, IoT, LDAP, SSO, OAuth',
          },
        ],
      })
      .subscribe(res => {
        this.storageServices = res.services;
      });
  }

  storageServices: Array<Service> = [];
  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ data, systemEvents, type }) => {
      console.log(systemEvents);
      this.type = type;
      if (type === 'edit') {
        this.scriptDetails = data;
        this.scriptForm.patchValue(data);
        this.scriptForm.controls['name'].disable();
      } else {
        this.scriptEvents = groupEvents(data);
      }
    });
    this.scriptEventsOptions = this.scriptForm.controls[
      'name'
    ].valueChanges.pipe(
      startWith(''),
      map(value => this.filterGroup(value))
    );
    this.scriptForm.controls['storageServiceId'].valueChanges.subscribe(res => {
      return this.eventScriptService.get(res.name).subscribe(res => {
        console.log(res);
      });
    });
    this.loaded = true;
  }

  getControl(name: string) {
    return this.scriptForm.controls[name] as FormControl;
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  submit(): void {
    if (!this.scriptForm.valid) {
      return;
    }
    const script = this.scriptForm.getRawValue();
    if (this.type === 'edit') {
      this.scriptDetails = { ...this.scriptDetails, ...script };
      this.eventScriptService
        .update(script.name, script)
        .subscribe(() => this.goBack());
    } else {
      this.scriptDetails = script;
      this.eventScriptService
        .create(script, undefined, script.name)
        .subscribe(() => this.goBack());
    }
  }

  private filterGroup(value: string): Array<ScriptEvent> {
    if (value) {
      return this.scriptEvents
        .map(group => ({
          name: group.name,
          endpoints: group.endpoints.filter(option =>
            option.toLowerCase().includes(value.toLowerCase())
          ),
        }))
        .filter(group => group.endpoints.length > 0);
    }
    return this.scriptEvents;
  }
}

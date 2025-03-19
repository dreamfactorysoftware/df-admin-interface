import {
  Component,
  DoCheck,
  Input,
  OnInit,
  Optional,
  Self,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import {
  FormControl,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfigSchema } from '../../types/service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfArrayFieldComponent } from '../df-field-array/df-array-field.component';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, map, startWith } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { addGroupEntries } from '../../utilities/eventScripts';
import { DfThemeService } from '../../services/df-theme.service';
import { DfFileSelectorComponent, SelectedFile } from '../df-file-selector/df-file-selector.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-dynamic-field',
  templateUrl: './df-dynamic-field.component.html',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    NgFor,
    DfArrayFieldComponent,
    MatButtonModule,
    TranslocoPipe,
    FontAwesomeModule,
    MatTooltipModule,
    MatAutocompleteModule,
    AsyncPipe,
    DfFileSelectorComponent
  ],
})
export class DfDynamicFieldComponent implements OnInit, DoCheck, AfterViewInit {
  @Input() schema: ConfigSchema;
  @Input() showLabel = true;
  @ViewChild('fileSelector') fileSelector: DfFileSelectorComponent;
  faCircleInfo = faCircleInfo;
  control = new FormControl();
  private pendingFilePath: string | null = null;

  onChange: (value: any) => void;
  onTouched: () => void;

  constructor(
    @Optional() @Self() public controlDir: NgControl,
    private activedRoute: ActivatedRoute,
    private themeService: DfThemeService
  ) {
    controlDir.valueAccessor = this;
  }

  eventList: string[] = [];
  filteredEventList: Observable<string[]>;
  isDarkMode = this.themeService.darkMode$;

  ngOnInit(): void {
    if (this.schema.type === 'event_picklist') {
      this.activedRoute.data.subscribe((data: any) => {
        if (data.systemEvents && data.systemEvents.resource) {
          this.eventList = addGroupEntries(data.systemEvents.resource);
        }
      });
      this.filteredEventList = this.control.valueChanges.pipe(
        startWith(''),
        map((value: string) => {
          if (!value || !this.eventList) return [];
          return this.eventList.filter(event =>
            event.toLowerCase().includes(value.toLowerCase())
          );
        })
      );
    }
  }

  ngDoCheck(): void {
    if (
      this.controlDir.control instanceof FormControl &&
      this.controlDir.control.hasValidator(Validators.required)
    ) {
      this.control.addValidators(Validators.required);
    }
  }

  ngAfterViewInit(): void {
    if (this.schema?.type === 'file_certificate_api' && this.fileSelector) {
      if (this.pendingFilePath) {
        console.log('Applying pending file path after view init:', this.pendingFilePath);
        this.fileSelector.setPath(this.pendingFilePath);
        this.pendingFilePath = null;
      } else if (this.control.value && typeof this.control.value === 'string') {
        console.log('Setting file selector path after view init:', this.control.value);
        this.fileSelector.setPath(this.control.value);
      }
    }
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.control.setValue(input.files[0]);
    }
  }

  onFileSelected(file: SelectedFile | undefined) {
    if (file) {
      this.control.setValue(file.path);
      
      console.log('File selected in dynamic field:', file);
    } else {
      this.control.setValue(null);
    }
  }

  writeValue(value: any): void {
    console.log('Dynamic field writeValue:', value, 'Schema type:', this.schema?.type);
    
    if (this.schema?.type === 'file_certificate_api' && typeof value === 'string' && value) {
      console.log('Setting file path value:', value);
      
      this.control.setValue(value, { emitEvent: false });
      
      if (this.fileSelector) {
        console.log('Setting path on file selector:', value);
        this.fileSelector.setPath(value);
      } else {
        console.log('File selector not yet available, storing pending path:', value);
        this.pendingFilePath = value;
      }
      
      return;
    }
    
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.control.valueChanges.subscribe(value => this.onChange(value));
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.control.disable() : this.control.enable();
  }
}

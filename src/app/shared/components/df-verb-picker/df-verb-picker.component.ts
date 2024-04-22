import { NgFor, NgIf } from '@angular/common';
import { Component, DoCheck, Input, Self } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe, translate } from '@ngneat/transloco';
import { ConfigSchema } from '../../types/service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { UntilDestroy } from '@ngneat/until-destroy';

type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-verb-picker',
  templateUrl: './df-verb-picker.component.html',
  standalone: true,
  imports: [
    TranslocoPipe,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    NgFor,
    NgIf,
    MatTooltipModule,
    FontAwesomeModule,
  ],
})
export class DfVerbPickerComponent implements ControlValueAccessor, DoCheck {
  @Input() type: 'number' | 'verb' | 'verb_multiple' = 'verb';
  @Input() schema: Partial<ConfigSchema>;
  @Input() showLabel = true;
  faCircleInfo = faCircleInfo;
  control = new FormControl();

  verbs = [
    {
      value: 1,
      altValue: 'GET',
      label: translate('verbs.get'),
    },
    {
      value: 2,
      altValue: 'POST',
      label: translate('verbs.post'),
    },
    {
      value: 4,
      altValue: 'PUT',
      label: translate('verbs.put'),
    },
    {
      value: 8,
      altValue: 'PATCH',
      label: translate('verbs.patch'),
    },
    {
      value: 16,
      altValue: 'DELETE',
      label: translate('verbs.delete'),
    },
  ];

  onChange: (value: number | Verb | Array<Verb>) => void;
  onTouched: () => void;

  constructor(@Self() public controlDir: NgControl) {
    controlDir.valueAccessor = this;
  }

  ngDoCheck(): void {
    if (
      this.controlDir.control instanceof FormControl &&
      this.controlDir.control.hasValidator(Validators.required)
    ) {
      this.control.addValidators(Validators.required);
    }
  }

  writeValue(value?: number | Verb | Array<Verb>): void {
    if (!value) {
      return;
    }
    if (this.type === 'number' && typeof value === 'number') {
      const selectedValues = this.verbs
        .filter(verb => (value & verb.value) === verb.value)
        .map(verb => verb.value);
      this.control.setValue(selectedValues, { emitEvent: false });
    } else if (this.type === 'verb' && typeof value === 'string') {
      this.control.setValue(
        this.verbs.find(vr => vr.altValue === value)?.value ?? '',
        { emitEvent: false }
      );
    } else {
      this.control.setValue(
        (value as Array<Verb>).map(
          v => this.verbs.find(vr => vr.altValue === v)?.value ?? 0
        ),
        { emitEvent: false }
      );
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.control.valueChanges.subscribe(selected => {
      const total =
        this.type === 'number'
          ? (selected || []).reduce((acc: number, val: number) => acc | val, 0)
          : this.type === 'verb_multiple'
          ? ((selected || []).map(
              (v: any) => this.verbs.find(vr => vr.value === v)?.altValue ?? ''
            ) as Array<Verb>)
          : this.verbs.find(vr => vr.value === selected)?.altValue ?? '';
      this.onChange(total);
    });
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    disabled ? this.control.disable() : this.control.enable();
  }
}

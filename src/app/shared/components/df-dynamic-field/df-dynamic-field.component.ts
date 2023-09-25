import {
  Component,
  DoCheck,
  Input,
  OnDestroy,
  Optional,
  Self,
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
import { NgFor, NgIf } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfArrayFieldComponent } from '../df-field-array/df-array-field.component';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';

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
  ],
})
export class DfDynamicFieldComponent implements OnDestroy, DoCheck {
  destroyed$ = new Subject<void>();
  @Input() schema: ConfigSchema;
  @Input() showLabel = true;
  faCircleInfo = faCircleInfo;
  control = new FormControl();

  onChange: (value: any) => void;
  onTouched: () => void;

  constructor(@Optional() @Self() public controlDir: NgControl) {
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

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.control.setValue(input.files[0]);
    }
  }

  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.control.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => this.onChange(value));
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.control.disable() : this.control.enable();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

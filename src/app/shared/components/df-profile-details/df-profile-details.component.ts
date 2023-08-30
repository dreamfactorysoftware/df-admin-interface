import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'df-profile-details',
  templateUrl: './df-profile-details.component.html',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoPipe,
    NgIf,
  ],
})
export class DfProfileDetailsComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  rootForm: FormGroup;
  constructor(private rootFormGroup: FormGroupDirective) {}

  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.rootForm.markAllAsTouched();
      });
  }

  controlExists(control: string): boolean {
    return this.rootForm.get(control) !== null;
  }

  isRequired(control: string): boolean {
    return !!this.rootForm.get(control)?.hasValidator(Validators.required);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

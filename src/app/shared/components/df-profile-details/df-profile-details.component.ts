import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'df-profile-details',
  templateUrl: './df-profile-details.component.html',
  styleUrls: ['./df-profile-details.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
})
export class DfProfileDetailsComponent implements OnInit {
  rootForm: FormGroup;
  constructor(private rootFormGroup: FormGroupDirective) {}

  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
  }

  controlExists(control: string): boolean {
    return this.rootForm.get(control) !== null;
  }

  isRequired(control: string): boolean {
    return !!this.rootForm.get(control)?.hasValidator(Validators.required);
  }
}

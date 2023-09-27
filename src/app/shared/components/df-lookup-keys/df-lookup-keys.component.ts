import { NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatExpansionModule } from '@angular/material/expansion';
import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-lookup-keys',
  templateUrl: './df-lookup-keys.component.html',
  styleUrls: ['./df-lookup-keys.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgTemplateOutlet,
    MatFormFieldModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    MatSlideToggleModule,
    FontAwesomeModule,
    MatExpansionModule,
    TranslocoPipe,
  ],
})
export class DfLookupKeysComponent implements OnInit {
  rootForm: FormGroup;
  lookupKeys: FormArray;
  dataSource: MatTableDataSource<any>;
  displayedColumns = ['name', 'value', 'private', 'actions'];
  faTrashCan = faTrashCan;
  faPlus = faPlus;
  @Input() showAccordion = true;

  constructor(private rootFormGroup: FormGroupDirective) {}

  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit.subscribe(() => {
      this.lookupKeys.markAllAsTouched();
    });
    this.lookupKeys = this.rootForm.get('lookupKeys') as FormArray;
    this.updateDataSource();
  }

  updateDataSource() {
    this.dataSource = new MatTableDataSource(this.lookupKeys.controls);
  }

  add() {
    this.lookupKeys.push(
      new FormGroup({
        name: new FormControl('', Validators.required),
        value: new FormControl(''),
        private: new FormControl(false),
      })
    );
    this.updateDataSource();
  }

  remove(index: number) {
    this.lookupKeys.removeAt(index);
    this.updateDataSource();
  }
}

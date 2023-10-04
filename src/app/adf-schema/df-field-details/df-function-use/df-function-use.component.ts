import { NgIf, NgFor, NgTemplateOutlet } from '@angular/common';
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
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTrashCan,
  faPlus,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatSelectModule } from '@angular/material/select';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MatTooltipModule } from '@angular/material/tooltip';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-function-use',
  templateUrl: './df-function-use.component.html',
  styleUrls: ['./df-function-use.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    MatFormFieldModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    FontAwesomeModule,
    MatExpansionModule,
    TranslocoPipe,
    MatTooltipModule,
  ],
})
export class DfFunctionUseComponent implements OnInit {
  rootForm: FormGroup;
  keys: FormArray;
  dataSource: MatTableDataSource<any>;
  displayedColumns = ['use', 'function', 'actions'];
  faTrashCan = faTrashCan;
  faPlus = faPlus;
  faCircleInfo = faCircleInfo;
  @Input() showAccordion = true;

  functionUsesDropdownOptions = [
    {
      name: 'SELECT (get)',
      value: 'SELECT',
    },
    {
      name: 'FILTER (get)',
      value: 'FILTER',
    },
    {
      name: 'INSERT (post)',
      value: 'INSERT',
    },
    {
      name: 'UPDATE (patch)',
      value: 'UPDATE',
    },
  ];

  constructor(private rootFormGroup: FormGroupDirective) {}

  ngOnInit(): void {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit.subscribe(() => {
      this.keys.markAllAsTouched();
    });
    this.keys = this.rootForm.get('dbFunction') as FormArray;
    this.updateDataSource();
  }

  updateDataSource() {
    this.dataSource = new MatTableDataSource(this.keys.controls);
  }

  add() {
    this.keys.push(
      new FormGroup({
        use: new FormControl([''], Validators.required),
        function: new FormControl(''),
      })
    );
    this.updateDataSource();
  }

  remove(index: number) {
    this.keys.removeAt(index);
    this.updateDataSource();
  }
}

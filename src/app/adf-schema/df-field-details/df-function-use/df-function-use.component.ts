import { NgIf, NgFor, NgTemplateOutlet } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
import { faTrashCan, faPlus } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';

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
  ],
})
export class DfFunctionUseComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  rootForm: FormGroup;
  keys: FormArray;
  dataSource: MatTableDataSource<any>;
  displayedColumns = ['uses', 'function', 'actions'];
  faTrashCan = faTrashCan;
  faPlus = faPlus;
  @Input() showAccordion = true;

  // TODO: add translation to the name attribute of these objects
  functionUsesDropdownOptions = [
    {
      name: 'SELECT (get)',
      value: 'select',
    },
    {
      name: 'FILTER (get)',
      value: 'filter',
    },
    {
      name: 'INSERT (post)',
      value: 'insert',
    },
    {
      name: 'UPDATE (patch)',
      value: 'update',
    },
  ];

  constructor(private rootFormGroup: FormGroupDirective) {}

  ngOnInit(): void {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.keys.markAllAsTouched();
      });
    this.keys = this.rootForm.get('dbFunctionUse') as FormArray;
    this.updateDataSource();
  }

  updateDataSource() {
    this.dataSource = new MatTableDataSource(this.keys.controls);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  add() {
    this.keys.push(
      new FormGroup({
        uses: new FormControl([''], Validators.required),
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

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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AppType } from 'src/app/adf-apps/types/df-apps.types';
import { RoleType } from '../../types/role';
import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { NgIf } from '@angular/common';

@Component({
  selector: 'df-user-app-roles',
  templateUrl: './df-user-app-roles.component.html',
  styleUrls: ['./df-user-app-roles.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    FontAwesomeModule,
    MatExpansionModule,
    TranslocoPipe,
    NgIf,
  ],
})
export class DfUserAppRolesComponent implements OnInit, OnDestroy {
  @Input() apps: Array<AppType> = [];
  @Input() roles: Array<RoleType> = [];
  destroyed$ = new Subject<void>();
  rootForm: FormGroup;
  appRoles: FormArray;
  dataSource: MatTableDataSource<any>;
  displayedColumns = ['app', 'role', 'actions'];
  faTrashCan = faTrashCan;
  faPlus = faPlus;

  constructor(private rootFormGroup: FormGroupDirective) {}

  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.rootForm.markAllAsTouched();
      });
    this.appRoles = this.rootForm.get('appRoles') as FormArray;
    this.updateDataSource();
  }

  updateDataSource() {
    this.dataSource = new MatTableDataSource(this.appRoles.controls);
  }

  get availableApps() {
    return this.apps.filter(
      app =>
        !this.appRoles.value.find((appRole: any) => appRole.app === app.name)
    );
  }

  get showAddButton() {
    return this.appRoles.length < this.apps.length;
  }

  get assignedApps() {
    return this.apps.length - this.appRoles.length;
  }

  add() {
    this.appRoles.push(
      new FormGroup({
        app: new FormControl('', Validators.required),
        role: new FormControl('', Validators.required),
      })
    );
    this.updateDataSource();
  }

  remove(index: number) {
    this.appRoles.removeAt(index);
    this.updateDataSource();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfFolderDialogComponent } from './df-folder-dialog.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';

describe('DfFolderDialogComponent', () => {
  let component: DfFolderDialogComponent;
  let fixture: ComponentFixture<DfFolderDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfFolderDialogComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatDialogModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: {
              pipe: () => {
                return {
                  subscribe: (fn: (value: any) => void) => fn({}),
                };
              },
            },
          },
        },
        {
          provide: MatDialogRef,
          useValue: {},
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
      ],
    });
    fixture = TestBed.createComponent(DfFolderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call save if form is invalid', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.save();
    expect(component.dialogForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it.only('should call save if form is valid', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.dialogForm.controls['name'].setValue('test');
    component.save();
    expect(component.dialogForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

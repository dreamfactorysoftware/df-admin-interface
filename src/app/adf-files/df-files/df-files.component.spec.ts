import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfFilesComponent } from './df-files.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { of } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { DfFolderDialogComponent } from '../df-folder-dialog/df-folder-dialog.component';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';

describe('DfFilesComponent', () => {
  let component: DfFilesComponent;
  let fixture: ComponentFixture<DfFilesComponent>;
  let mockDialog: MatDialog;
  let loader: HarnessLoader;

  beforeEach(() => {
    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of({ refreshData: true }),
      }),
    } as any;

    TestBed.configureTestingModule({
      imports: [
        DfFilesComponent,
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
            paramMap: of({
              get: (key: string) => {
                if (key === 'entity') {
                  return 'testFolder';
                }
                return null;
              },
            }),
            snapshot: {
              url: 'test-url',
            },
          },
        },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MAT_DIALOG_DATA, useValue: { route: 'test-url' } },
      ],
    });
    fixture = TestBed.createComponent(DfFilesComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should upload a file', () => {
    const crudServiceSpy = jest.spyOn(
      DfBaseCrudService.prototype,
      'uploadFile'
    );

    const file = new File(['content'], 'filename.txt', { type: 'text/plain' });
    const files = { target: { files: [file] } } as unknown as Event;

    component.uploadFile(files);

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it.only('should open folder dialog', async () => {
    const dialog = await loader.getHarness(
      MatDialogHarness.with({
        selector: '.df-folder-dialog',
      })
    );

    component.filesTable = {
      refreshTable: jest.fn(),
    } as any;

    await component.createFolder();

    expect(dialog).toHaveBeenCalled();
    expect(component.filesTable.refreshTable).toHaveBeenCalled();
  });
});

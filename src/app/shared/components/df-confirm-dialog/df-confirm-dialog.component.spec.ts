import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DfConfirmDialogComponent } from './df-confirm-dialog.component';
import { createTestBedConfig } from '../../utilities/test';

describe('DfConfirmDialogComponent', () => {
  let component: DfConfirmDialogComponent;
  let fixture: ComponentFixture<DfConfirmDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfConfirmDialogComponent,
        [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {},
          },
          {
            provide: MatDialogRef,
            useValue: {
              close: (bool: boolean) => {
                return;
              },
            },
          },
        ],
        {}
      )
    );

    fixture = TestBed.createComponent(DfConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the dialog when the close button is clicked', () => {
    const closeSpy = jest.spyOn(component.dialogRef, 'close');

    component.onClose();

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});

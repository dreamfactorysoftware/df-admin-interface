import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createTestBedConfig } from '../../utilities/test';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from './df-manage-table.component';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

interface MockTableDataType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

@Component({
  standalone: true,
  templateUrl: './df-manage-table.component.html',
  imports: [...DfManageTableModules],
})
class TestManageTableComponent<
  MockTableDataType,
> extends DfManageTableComponent<MockTableDataType> {
  override columns: {
    columnDef: string;
    cell?: ((element: MockTableDataType) => any) | undefined;
    header?: string | undefined;
  }[] = [];
  override mapDataToTable(data: any[]): MockTableDataType[] {
    throw new Error('Method not implemented.');
  }
  override refreshTable(
    limit?: number | undefined,
    offset?: number | undefined,
    filter?: string | undefined
  ): void {
    throw new Error('Method not implemented.');
  }
  override filterQuery(value: string): string {
    throw new Error('Method not implemented.');
  }
}

class MockDialog {
  open() {
    return {
      afterClosed: () => of({}),
    };
  }
}

describe('DfManageTableComponent', () => {
  let component: TestManageTableComponent<MockTableDataType>;
  let fixture: ComponentFixture<TestManageTableComponent<MockTableDataType>>;
  let router: Router;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        TestManageTableComponent,
        [...DfManageTableModules, { provide: MatDialog, useClass: MockDialog }],
        {}
      )
    );

    router = TestBed.inject(Router);
    dialog = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent<
      TestManageTableComponent<MockTableDataType>
    >(TestManageTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the create route relative to the current route when the create button is clicked', () => {
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.createRow();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should navigate to the view route relative to the current route when the table row is clicked', () => {
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.viewRow({
      id: 1,
      name: 'test',
      description: 'test',
      isActive: true,
    });

    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  // TODO: Fix this test
  it.skip('should open the dialog when the delete button is clicked', () => {
    const dialogSpy = jest.spyOn(dialog, 'open');

    component.confirmDelete({
      id: 1,
      name: 'test',
      description: 'test',
      isActive: true,
    });

    expect(dialogSpy).toHaveBeenCalled();
  });
});

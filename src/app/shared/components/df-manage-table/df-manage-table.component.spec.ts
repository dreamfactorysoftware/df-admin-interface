import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createTestBedConfig } from '../../utilities/test';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from './df-manage-table.component';
import { Component } from '@angular/core';

export interface MockTableDataType {
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
export class TestManageTableComponent<
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

describe('DfManageTableComponent', () => {
  let component: TestManageTableComponent<MockTableDataType>;
  let fixture: ComponentFixture<TestManageTableComponent<MockTableDataType>>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(TestManageTableComponent, [...DfManageTableModules], {
        data: {},
      })
    );

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

  // TODO: implement remaining tests
});

import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface AppElement {
  position: number;
  id: number;
  name: string;
  role: string;
  apiKey: string;
}
const MOCK_DATA: AppElement[] = [
  {
    position: 1,
    id: 1,
    name: 'App 1',
    role: 'Admin',
    apiKey: '1234567890',
  },
  {
    position: 2,
    id: 2,
    name: 'App 2',
    role: '',
    apiKey: '0987654321',
  },
];
@Component({
  selector: 'df-df-manage-apps',
  templateUrl: './df-manage-apps.component.html',
  styleUrls: ['./df-manage-apps.component.scss'],
})
export class DfManageAppsComponent implements AfterViewInit {
  faTrash = faTrash;
  displayedColumns: string[] = ['select', 'id', 'name', 'role', 'apiKey'];
  dataSource = new MatTableDataSource<AppElement>(MOCK_DATA);
  selection = new SelectionModel<AppElement>(true, []);
  hasSelectedRows = true;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    // this.selection.changed.subscribe(change => {
    //   console.log('selection changed', change);
    //   this.hasSelectedRows = change.source.selected.length > 0;
    // });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    console.log('toggleAllRows');
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: AppElement): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onMassDelete() {
    console.log('mass delete', this.selection.selected);
    //   const rows = this.selection.selected
    //     .filter(val => {
    //       return val.deletable;
    //     })
    //     .map(val => val.id);

    //   return this.serviceDataService
    //     .deleteMultipleServiceData(rows)
    //     .pipe(
    //       catchError(err => {
    //         this.alertMsg = 'Error occurred with delete service';
    //         this.alertType = 'error';
    //         this.showAlert = true;
    //         return throwError(() => new Error(err));
    //       })
    //     )
    //     .subscribe((data: GroupDeleteServiceResponse) => {
    //       if (data.resource.length) {
    //         this.alertMsg = 'Service successfully deleted';
    //         this.showAlert = true;
    //         this.alertType = 'success';
    //       }
    //     });
  }
}

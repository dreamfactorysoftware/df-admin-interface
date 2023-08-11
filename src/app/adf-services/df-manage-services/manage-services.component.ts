import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  ServiceDataService,
  SystemServiceDataResponse,
} from 'src/app/core/services/service-data.service';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { MatTableDataSource } from '@angular/material/table';
import { UserData } from 'src/app/core/services/df-user-data.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

type ServiceTableData = {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  active: boolean;
  deletable: boolean;
};

@Component({
  selector: 'df-manage-services',
  templateUrl: './manage-services.component.html',
  styleUrls: ['./manage-services.component.scss'],
})
export class DfManageServicesComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private destroyed$ = new Subject<void>();

  displayedColumns: string[] = [
    'id',
    'name',
    'label',
    'description',
    'type',
    'active',
    'deletable',
  ];
  dataSource: MatTableDataSource<ServiceTableData>;
  data: ServiceTableData[];

  systemServiceData: SystemServiceDataResponse | null;

  faTrash = faTrash;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private serviceDataService: ServiceDataService) {}

  ngOnInit(): void {
    this.serviceDataService.systemServiceData$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.systemServiceData = data as SystemServiceDataResponse;
        this.data = this.systemServiceData.resource.map(val => {
          return {
            id: val.id,
            name: val.name,
            label: val.label,
            description: val.description,
            type: val.type,
            active: val.is_active,
            deletable: val.deletable,
          };
        });
        this.dataSource = new MatTableDataSource(this.data);
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onRowClick(row: ServiceTableData): void {
    console.log('clicked!', row.id);
  }

  onDelete(row: number): void {
    console.log('delete button clicked!', row);
  }
}

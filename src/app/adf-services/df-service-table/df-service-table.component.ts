import { Component } from '@angular/core';

type ServiceTableData = {
  id: string;
  name: string;
  label: string;
  description: string;
  type: string;
  active: string;
};

@Component({
  selector: 'df-service-table',
  templateUrl: './df-service-table.component.html',
  styleUrls: ['./df-service-table.component.scss'],
})
export class DfServiceTableComponent {
  displayedColumns: string[] = [
    'id',
    'name',
    'label',
    'description',
    'type',
    'active',
  ];
  dataSource: ServiceTableData[];
  // TODO: connect this to an api when ready
}

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
  selector: 'df-manage-services',
  templateUrl: './manage-services.component.html',
  styleUrls: ['./manage-services.component.scss'],
})
export class DfManageServicesComponent {
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

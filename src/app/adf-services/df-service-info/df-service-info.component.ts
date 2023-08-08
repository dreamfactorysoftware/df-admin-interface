import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';

type ServiceType = {
  id: number;
  name: string;
  label: string;
  description: string;
  is_active: boolean;
  group_name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  group_types: any[];
  type: string;
  mutable: boolean;
  deletable: boolean;
  created_date: string;
  last_modified_date: string;
  created_by_id: string | null;
  last_modified_by_id: string | null;
  config: object | null;
  service_doc_by_service_id: string | null;
};

type DfServiceInfoDataObj = {
  selectedServiceName: string;
  serviceInfoNamespace: string;
  serviceInfoLabel: string;
  serviceInfoDescription: string;
  isServiceActive: boolean;
};

@Component({
  selector: 'df-service-info',
  templateUrl: './df-service-info.component.html',
  styleUrls: ['./df-service-info.component.scss'],
})
export class DfServiceInfoComponent {
  selectedSchema: ServiceType | null;
  newService: ServiceType | null;
  serviceTypes: ServiceType[];
  dfServiceInfoDataObj: DfServiceInfoDataObj;

  namespace = new FormControl('');
  label = new FormControl('');
  description = new FormControl('');
  isActive = new FormControl(true);

  serviceTypesSingleColLimit = 3; // TODO: update

  constructor() {
    this.selectedSchema = null;
    this.newService = null;
    this.serviceTypes = []; // TODO: connect this to api in which this array will be populated by
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  changeServiceType(name: string) {}
}

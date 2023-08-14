import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SystemServiceData } from 'src/app/core/services/service-data.service';

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
  selectedSchema: SystemServiceData | null;
  newService: SystemServiceData | null;
  serviceTypes: SystemServiceData[];
  dfServiceInfoDataObj: DfServiceInfoDataObj;

  namespace = new FormControl('');
  label = new FormControl('');
  description = new FormControl('');
  isActive = new FormControl(true);

  serviceTypesSingleColLimit = 3;

  constructor() {
    this.selectedSchema = null;
    this.newService = null;
    this.serviceTypes = [];
  }

  changeServiceType(name: string) {
    name;
  }
}

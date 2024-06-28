import {
  Component,
  Inject,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DfBaseCrudService } from '../../services/df-base-crud.service';
import {
  BASE_SERVICE_TOKEN,
  CACHE_SERVICE_TOKEN,
  EVENT_SCRIPT_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { switchMap } from 'rxjs';
import { readAsText } from '../../utilities/file';
import { Service, ServiceType } from '../../types/service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-link-service',
  templateUrl: './df-link-service.component.html',
  styleUrls: ['./df-link-service.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    FontAwesomeModule,
    MatExpansionModule,
    TranslocoPipe,
    AsyncPipe,
    MatOptionModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  providers: [DfBaseCrudService],
})
export class DfLinkServiceComponent implements OnInit, OnChanges {
  @Input() cache: string;
  @Input({ required: true }) storageServiceId!: string;

  @Input({ required: true }) storagePath: FormControl;
  @Input({ required: true }) content: FormControl;

  roleForm: FormGroup;
  storageServices: Array<Service> = [];
  selectType = false;

  constructor(
    private themeService: DfThemeService,
    @Inject(CACHE_SERVICE_TOKEN) private cacheService: DfBaseCrudService,
    @Inject(BASE_SERVICE_TOKEN) private baseService: DfBaseCrudService,
    @Inject(EVENT_SCRIPT_SERVICE_TOKEN) private crudService: DfBaseCrudService
  ) {
    this.roleForm = new FormGroup({
      serviceList: new FormControl(''),
      repoInput: new FormControl(''),
      branchInput: new FormControl(''),
      pathInput: new FormControl(''),
    });
    this.baseService
      .getAll<{
        serviceTypes: Array<ServiceType>;
        services: Array<Service>;
      }>({
        additionalParams: [
          {
            key: 'group',
            value: 'source control,file',
          },
        ],
      })
      .subscribe(res => {
        this.storageServices = res.services;
      });
  }
  isDarkMode = this.themeService.darkMode$;
  ngOnInit() {
    this.updateDataSource();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['storageServiceId']) {
      this.findServiceById();
    }
  }

  findServiceById() {
    const select = this.storageServices.find(
      service => service.name === this.storageServiceId
    );
    if (select?.type === 'github') {
      this.selectType = true;
    } else {
      this.selectType = false;
    }
  }

  updateDataSource() {
    //
  }
  onViewLatest() {
    const formValues = this.roleForm.getRawValue();
    const service = formValues.serviceList ?? '';
    const repo = formValues.repoInput ?? '';
    const branch = formValues.branchInput ?? '';
    const path = formValues.pathInput ?? '';

    const filePath = `${service}/_repo/${repo}?branch=${branch}&content=1&path=${path}`;

    if (filePath.endsWith('.json')) {
      this.baseService
        .downloadJson(filePath)
        .subscribe(text => this.content.setValue(text));
      return;
    } else {
      this.baseService
        .downloadFile(filePath)
        .pipe(switchMap(res => readAsText(res as Blob)))
        .subscribe(text => this.content.setValue(text));
    }
  }

  onDeleteCache() {
    if (!this.cache) return;
    this.cacheService
      .delete(`_event/${this.cache}`, {
        snackbarSuccess: 'scripts.deleteCacheSuccessMsg',
      })
      .subscribe();
  }
}

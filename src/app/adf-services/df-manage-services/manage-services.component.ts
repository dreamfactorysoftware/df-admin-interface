import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  ServiceDataService,
  SystemServiceDataResponse,
} from 'src/app/core/services/service-data.service';

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
export class DfManageServicesComponent implements OnInit, OnDestroy {
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
  dataSource: ServiceTableData[];

  systemServiceData: SystemServiceDataResponse | null;

  constructor(private serviceDataService: ServiceDataService) {
    this.dataSource = [];
    // TODO: replace/remove this
    // this.dataSource = exampleData.resource.map(val => {
    //   return {
    //     id: val.id,
    //     name: val.name,
    //     label: val.label,
    //     description: val.description,
    //     type: val.type,
    //     active: val.is_active,
    //     deletable: val.deletable,
    //   };
    // });
  }

  ngOnInit(): void {
    this.serviceDataService.systemServiceData$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.systemServiceData = data as SystemServiceDataResponse;
        console.log('systemServiceData: ', this.systemServiceData);
        this.dataSource = this.systemServiceData.resource.map(val => {
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
      });
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

// TODO: remove this
const exampleData = {
  resource: [
    {
      id: 1,
      name: 'system',
      label: 'System Management',
      description: 'Service for managing system resources.',
      is_active: true,
      type: 'system',
      mutable: false,
      deletable: false,
      created_date: '2023-08-04T21:10:07.000000Z',
      last_modified_date: '2023-08-04T21:10:07.000000Z',
      created_by_id: null,
      last_modified_by_id: null,
      config: {
        service_id: 1,
        default_app_id: null,
        invite_email_service_id: 6,
        invite_email_template_id: 1,
        password_email_service_id: 6,
        password_email_template_id: 3,
      },
      service_doc_by_service_id: null,
    },
    {
      id: 2,
      name: 'api_docs',
      label: 'Live API Docs',
      description: 'API documenting and testing service.',
      is_active: true,
      type: 'swagger',
      mutable: false,
      deletable: false,
      created_date: '2023-08-04T21:10:07.000000Z',
      last_modified_date: '2023-08-04T21:10:07.000000Z',
      created_by_id: null,
      last_modified_by_id: null,
      config: [],
      service_doc_by_service_id: null,
    },
    {
      id: 3,
      name: 'files',
      label: 'Local File Storage',
      description: 'Service for accessing local file storage.',
      is_active: true,
      type: 'local_file',
      mutable: true,
      deletable: true,
      created_date: '2023-08-04T21:10:07.000000Z',
      last_modified_date: '2023-08-08T20:46:01.000000Z',
      created_by_id: null,
      last_modified_by_id: 1,
      config: {
        service_id: 3,
        public_path: ['test', 'eqeqe'],
        container: 'app',
      },
      service_doc_by_service_id: null,
    },
    {
      id: 4,
      name: 'logs',
      label: 'Local Log Storage',
      description: 'Service for accessing local log storage.',
      is_active: true,
      type: 'local_file',
      mutable: true,
      deletable: true,
      created_date: '2023-08-04T21:10:07.000000Z',
      last_modified_date: '2023-08-04T21:10:07.000000Z',
      created_by_id: null,
      last_modified_by_id: null,
      config: {
        service_id: 4,
        public_path: null,
        container: 'logs',
      },
      service_doc_by_service_id: null,
    },
    {
      id: 5,
      name: 'db',
      label: 'Local SQL Database',
      description: 'Service for accessing local SQLite database.',
      is_active: true,
      type: 'sqlite',
      mutable: true,
      deletable: true,
      created_date: '2023-08-04T21:10:07.000000Z',
      last_modified_date: '2023-08-04T21:10:07.000000Z',
      created_by_id: null,
      last_modified_by_id: null,
      config: {
        service_id: 5,
        options: null,
        attributes: null,
        statements: null,
        database: 'db.sqlite',
        cache_enabled: false,
        cache_ttl: 0,
        allow_upsert: false,
        max_records: false,
      },
      service_doc_by_service_id: null,
    },
    {
      id: 6,
      name: 'email',
      label: 'Local Email Service',
      description:
        'Email service used for sending user invites and/or password reset confirmation.',
      is_active: true,
      type: 'local_email',
      mutable: true,
      deletable: true,
      created_date: '2023-08-04T21:10:07.000000Z',
      last_modified_date: '2023-08-04T21:10:07.000000Z',
      created_by_id: null,
      last_modified_by_id: null,
      config: {
        parameters: [],
      },
      service_doc_by_service_id: null,
    },
    {
      id: 7,
      name: 'user',
      label: 'User Management',
      description: 'Service for managing system users.',
      is_active: true,
      type: 'user',
      mutable: true,
      deletable: false,
      created_date: '2023-08-04T21:10:07.000000Z',
      last_modified_date: '2023-08-04T21:10:07.000000Z',
      created_by_id: null,
      last_modified_by_id: null,
      config: {
        service_id: 7,
        allow_open_registration: false,
        open_reg_role_id: null,
        open_reg_email_service_id: 6,
        open_reg_email_template_id: 2,
        invite_email_service_id: 6,
        invite_email_template_id: 1,
        password_email_service_id: 6,
        password_email_template_id: 3,
        alt_auth_db_service_id: null,
        alt_auth_table: null,
        alt_auth_username_field: null,
        alt_auth_password_field: null,
        alt_auth_email_field: null,
        alt_auth_other_fields: null,
        alt_auth_filter: null,
        app_role_map: [],
      },
      service_doc_by_service_id: null,
    },
    {
      id: 8,
      name: 'test-namespace',
      label: 'test-label',
      description: 'Test service',
      is_active: true,
      type: 'mysql',
      mutable: true,
      deletable: true,
      created_date: '2023-08-08T19:55:43.000000Z',
      last_modified_date: '2023-08-08T19:55:43.000000Z',
      created_by_id: 1,
      last_modified_by_id: null,
      config: {
        service_id: 8,
        options: null,
        attributes: null,
        statements: null,
        host: 'localhost',
        port: 3000,
        database: '127.0.0.1:9090',
        username: 'test-user',
        password: '**********',
        schema: null,
        charset: null,
        collation: null,
        timezone: null,
        modes: null,
        strict: null,
        unix_socket: null,
        max_records: 1000,
        cache_enabled: false,
        cache_ttl: 0,
        allow_upsert: false,
      },
      service_doc_by_service_id: null,
    },
  ],
  meta: {
    count: 8,
  },
};

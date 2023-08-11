import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageServicesComponent } from './manage-services.component';
import { of } from 'rxjs';
import { ServiceDataService } from 'src/app/core/services/service-data.service';
import { By } from '@angular/platform-browser';

const mockSystemDataService = {
  systemServiceData$: jest.fn(),
};

describe('DfManageServicesComponent', () => {
  let component: DfManageServicesComponent;
  let fixture: ComponentFixture<DfManageServicesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfManageServicesComponent],
      providers: [
        { provide: ServiceDataService, useValue: mockSystemDataService },
      ],
    });
    fixture = TestBed.createComponent(DfManageServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    mockSystemDataService.systemServiceData$.mockReset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('list of services should visible by default', () => {
    mockSystemDataService.systemServiceData$.mockImplementationOnce(() =>
      of(sampleData)
    );

    fixture.detectChanges();

    const tableRows = fixture.debugElement.queryAll(By.css('.mat-mdc-row'));

    expect(tableRows).toHaveLength(3);
  });
});

const sampleData = {
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
  ],
  meta: {
    count: 8,
  },
};

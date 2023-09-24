import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ADMIN_SERVICE_PROVIDERS } from 'src/app/core/constants/providers';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';
import { DfManageAdminsTableComponent } from './df-manage-admins-table.component';
import * as fs from 'fs';

const MOCK_JSON_IMPORT = {
  resource: [
    {
      id: 1,
      name: 'test user 2',
      username: 'testuser2',
      ldap_username: null,
      first_name: 'test2',
      last_name: 'user2',
      last_login_date: '2023-09-21 18:14:41',
      email: 'test2@email.com',
      is_active: true,
      phone: '123-456-7890',
      security_question: null,
      default_app_id: null,
      adldap: null,
      oauth_provider: null,
      saml: null,
      created_date: '2023-08-04T20:50:17.000000Z',
      last_modified_date: '2023-09-21T18:14:41.000000Z',
      created_by_id: null,
      last_modified_by_id: null,
      is_root_admin: 1,
      confirmed: true,
      expired: false,
    },
  ],
};

fs.writeFileSync('test.json', JSON.stringify(MOCK_JSON_IMPORT));

describe('DfManageAdminsTableComponent', () => {
  let component: DfManageAdminsTableComponent;
  let fixture: ComponentFixture<DfManageAdminsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageAdminsTableComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: {
              pipe: () => {
                return {
                  subscribe: (fn: (value: any) => void) => fn({}),
                };
              },
            },
          },
        },
        ...ADMIN_SERVICE_PROVIDERS,
      ],
    });
    fixture = TestBed.createComponent(DfManageAdminsTableComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call exportList', () => {
    const crudServiceSpy = jest.spyOn(
      DfBaseCrudService.prototype,
      'exportList'
    );
    component.downloadAdminList('JSON');
    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should call adminService.importList with the correct parameters', () => {
    const crudServiceSpy = jest.spyOn(
      DfBaseCrudService.prototype,
      'importList'
    );

    const file = new File(['content'], 'filename.txt', { type: 'text/plain' });
    const files = { 0: file, length: 1 } as unknown as FileList;

    component.uploadAdminList(files);

    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ADMIN_SERVICE_PROVIDERS } from 'src/app/core/constants/providers';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';
import { DfManageAdminsTableComponent } from './df-manage-admins-table.component';

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

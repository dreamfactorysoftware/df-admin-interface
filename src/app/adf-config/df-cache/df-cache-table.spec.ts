import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DfCacheModal,
  DfCacheTableComponent,
} from './df-cache-table.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';

const ACTIVATED_ROUTE_DATA = {
  data: {
    resource: [
      {
        name: 'system',
        label: 'System Management',
        description: 'Service for managing system resources.',
        type: 'system',
      },
    ],
  },
};

describe('DfCacheTableComponent', () => {
  let component: DfCacheTableComponent;
  let fixture: ComponentFixture<DfCacheTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfCacheTableComponent,
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
              subscribe: (fn: (value: any) => void) => fn(ACTIVATED_ROUTE_DATA),
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfCacheTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should flush system cache', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'delete');
    component.clearCache({ name: 'system', label: 'System Management' });

    // The row action only opens the confirm dialog. The flush happens when
    // the user confirms in the dialog.
    expect(crudServiceSpy).not.toHaveBeenCalled();
    expect(component.dialog.openDialogs.length).toBe(1);
    const modal = component.dialog.openDialogs[0]
      .componentInstance as DfCacheModal;
    expect(modal.row).toEqual({ name: 'system', label: 'System Management' });

    modal.clearCache();
    expect(crudServiceSpy).toHaveBeenCalledWith('system', {
      snackbarSuccess: 'cache.serviceCacheFlushed',
    });

    component.dialog.closeAll();
  });
});

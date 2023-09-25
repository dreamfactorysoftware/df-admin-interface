import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfManageLimitsTableComponent } from './df-manage-limits-table.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';

describe('DfManageLimitsTableComponent', () => {
  let component: DfManageLimitsTableComponent;
  let fixture: ComponentFixture<DfManageLimitsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageLimitsTableComponent,
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
      ],
    });
    fixture = TestBed.createComponent(DfManageLimitsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should refresh rows', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'delete');
    component.refreshRow(2);
    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should throw error on refresh rows if there are no rows', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'delete');
    component.refreshRows();
    expect(crudServiceSpy).toThrowError();
  });
});

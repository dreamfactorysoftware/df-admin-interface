import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfCacheComponent } from './df-cache.component';
import { TranslocoService } from '@ngneat/transloco';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { createTestBedConfig } from 'src/app/shared/utilities/testbed-config';

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

describe('DfCacheComponent', () => {
  let component: DfCacheComponent;
  let fixture: ComponentFixture<DfCacheComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(DfCacheComponent, [TranslocoService], {
        ...ACTIVATED_ROUTE_DATA,
      })
    );
    fixture = TestBed.createComponent(DfCacheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls the service to clear cache', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'delete');
    component.flushSystemCache();
    fixture.detectChanges();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

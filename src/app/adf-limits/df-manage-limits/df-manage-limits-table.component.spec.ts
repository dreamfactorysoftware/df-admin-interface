import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfManageLimitsTableComponent } from './df-manage-limits-table.component';
import { TranslocoService } from '@ngneat/transloco';
import { createTestBedConfig } from 'src/app/shared/utilities/test';
import { mockLimitTypes, mockTableData } from './mocks/mocks';
import { of } from 'rxjs';
import {
  LIMIT_CACHE_SERVICE_TOKEN,
  LIMIT_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';

const mockLimitService = {
  getAll: jest.fn(),
  delete: jest.fn(),
};

const mockLimitCacheService = {
  delete: jest.fn(),
};

describe('DfManageLimitsTableComponent', () => {
  let component: DfManageLimitsTableComponent;
  let fixture: ComponentFixture<DfManageLimitsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfManageLimitsTableComponent,
        [
          TranslocoService,
          {
            provide: LIMIT_CACHE_SERVICE_TOKEN,
            useValue: mockLimitCacheService,
          },
          {
            provide: LIMIT_SERVICE_TOKEN,
            useValue: mockLimitService,
          },
        ],
        {
          meta: { count: 2 },
          resource: [...mockLimitTypes],
        }
      )
    );
    fixture = TestBed.createComponent(DfManageLimitsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should refresh rows', () => {
    mockLimitCacheService.delete.mockReturnValue(of({}));
    mockLimitService.getAll.mockReturnValue(of({}));
    component.refreshRow(mockTableData[0]);
    expect(mockLimitCacheService.delete).toHaveBeenCalled();
  });

  it('should delete rows when delete button is clicked', () => {
    mockLimitService.delete.mockReturnValue(of({}));
    mockLimitService.getAll.mockReturnValue(of({}));
    component.deleteRow(mockTableData[0]);
    expect(mockLimitService.delete).toHaveBeenCalled();
  });
});

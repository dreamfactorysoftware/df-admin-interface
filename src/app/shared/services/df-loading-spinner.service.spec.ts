import { TestBed } from '@angular/core/testing';
import { DfLoadingSpinnerService } from './df-loading-spinner.service';

describe('DfLoadingSpinnerService', () => {
  let service: DfLoadingSpinnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DfLoadingSpinnerService],
    });

    service = TestBed.inject(DfLoadingSpinnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an inactive spinner', () => {
    service.active.subscribe(active => {
      expect(active).toBeFalsy();
    });
  });

  it('should activate the spinner', () => {
    service.active.subscribe(active => {
      expect(active).toBeTruthy();
    });

    service.active = true;
  });

  it('should deactivate the spinner', () => {
    service.active = true;

    service.active.subscribe(active => {
      expect(active).toBeFalsy();
    });

    service.active = false;
  });

  it('should not allow negative active counter', () => {
    service.active = false;

    service.active.subscribe(active => {
      expect(active).toBeFalsy();
    });

    service.active = false;
  });
});

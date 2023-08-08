import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DfBreakpointService } from './df-breakpoint.service';
import { of } from 'rxjs';

describe('DfBreakpointService', () => {
  let service: DfBreakpointService;
  let breakpointObserverMock: jest.Mocked<BreakpointObserver>;

  beforeEach(() => {
    breakpointObserverMock = {
      observe: jest.fn().mockReturnValue(
        of({
          matches: false,
          breakpoints: {
            [Breakpoints.XSmall]: false,
            [Breakpoints.Small]: false,
          },
        })
      ),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        DfBreakpointService,
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
      ],
    });
  });

  it('should return false for non-small screens', () => {
    service = TestBed.inject(DfBreakpointService);
    service.isSmalllScreen.subscribe((isSmallScreen: boolean) => {
      expect(isSmallScreen).toBeFalsy();
    });
  });
  it('should return true for XSmall screens', () => {
    breakpointObserverMock.observe.mockReturnValue(
      of({
        matches: true,
        breakpoints: {
          [Breakpoints.XSmall]: true,
          [Breakpoints.Small]: false,
        },
      })
    );
    service = TestBed.inject(DfBreakpointService);
    service.isSmalllScreen.subscribe((isSmallScreen: boolean) => {
      expect(isSmallScreen).toBeTruthy();
    });
  });

  it('should return true for Small screens', () => {
    breakpointObserverMock.observe.mockReturnValue(
      of({
        matches: true,
        breakpoints: {
          [Breakpoints.XSmall]: false,
          [Breakpoints.Small]: true,
        },
      })
    );
    service = TestBed.inject(DfBreakpointService);
    service.isSmalllScreen.subscribe((isSmallScreen: boolean) => {
      expect(isSmallScreen).toBeTruthy();
    });
  });
});

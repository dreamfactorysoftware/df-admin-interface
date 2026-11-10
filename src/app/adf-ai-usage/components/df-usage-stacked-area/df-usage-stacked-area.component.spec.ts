import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeBucket } from '../../types/usage';
import { DfUsageStackedAreaComponent } from './df-usage-stacked-area.component';

const bucket = (
  date: string | undefined,
  inputTokens: number,
  outputTokens: number
): TimeBucket =>
  ({
    date,
    inputTokens,
    outputTokens,
    toolCalls: 0,
    sessions: 1,
    costUsd: 0,
  }) as TimeBucket;

describe('DfUsageStackedAreaComponent', () => {
  let fixture: ComponentFixture<DfUsageStackedAreaComponent>;
  let component: DfUsageStackedAreaComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DfUsageStackedAreaComponent] });
    fixture = TestBed.createComponent(DfUsageStackedAreaComponent);
    component = fixture.componentInstance;
  });

  const render = (data: unknown) => {
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
  };
  const emptyState = () => fixture.nativeElement.querySelector('.chart__empty');

  // Same tick code and same input as the df-cost-by-dimension crash: a
  // bucket with no date printed "NaN/NaN" on the x axis.
  it('does not print NaN/NaN for a bucket with no usable date', () => {
    expect(() =>
      render([
        bucket('2026-11-03', 100, 50),
        bucket(undefined, 0, 0),
        bucket('2026-11-05', 200, 80),
      ])
    ).not.toThrow();

    expect(component.hasData).toBe(true);
    expect(component.xTicks.map(t => t.label)).toEqual(['11/3', '', '11/5']);
    expect(fixture.nativeElement.textContent).not.toContain('NaN');
    expect(emptyState()).toBeNull();
  });

  // Regression: the day came from new Date('YYYY-MM-DD'), which is midnight
  // UTC, read back with the local getters. West of UTC every label was one
  // day early. jest.tz-setup.js pins the runner to America/Denver.
  describe('day labels', () => {
    it('show the calendar day in the timezone of the runner', () => {
      render([bucket('2026-01-01', 1, 1), bucket('2026-12-31', 1, 1)]);

      expect(component.xTicks.map(t => t.label)).toEqual(['1/1', '12/31']);
    });
  });
});

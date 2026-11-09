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

/**
 * Make the local-time getters answer as they do at the given UTC offset,
 * whatever timezone the runner is in. Jest cannot switch TZ per test.
 */
function emulateUtcOffset(hours: number): void {
  const shifted = (d: Date) => new Date(d.getTime() + hours * 3_600_000);
  jest.spyOn(Date.prototype, 'getDate').mockImplementation(function (
    this: Date
  ) {
    return shifted(this).getUTCDate();
  });
  jest.spyOn(Date.prototype, 'getMonth').mockImplementation(function (
    this: Date
  ) {
    return shifted(this).getUTCMonth();
  });
}

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

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty array', []],
    ['buckets with no tokens', [bucket('2026-11-03', 0, 0)]],
  ])('renders the empty state for %s', (_label, data) => {
    expect(() => render(data)).not.toThrow();
    expect(component.hasData).toBe(false);
    expect(component.layers).toEqual([]);
    expect(component.xTicks).toEqual([]);
    expect(emptyState()).not.toBeNull();
  });

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

  it('charts dated buckets with input and output layers', () => {
    render([bucket('2026-11-03', 100, 50), bucket('2026-11-04', 300, 100)]);

    expect(component.layers.map(l => [l.label, l.total])).toEqual([
      ['Input', 400],
      ['Output', 150],
    ]);
    expect(component.xTicks.map(t => t.label)).toEqual(['11/3', '11/4']);
    expect(component.yTicks.map(t => t.label)).toEqual(['0', '200', '400']);
  });

  // Regression: the day came from new Date('YYYY-MM-DD'), which is midnight
  // UTC, read back with the local getters. West of UTC every label was one
  // day early (11-03 to 11-06 showed as 11/2 to 11/5 in Denver).
  describe('day labels', () => {
    afterEach(() => jest.restoreAllMocks());

    const week = [
      bucket('2026-11-03', 100, 50),
      bucket('2026-11-04', 300, 100),
      bucket('2026-11-05', 200, 80),
      bucket('2026-11-06', 100, 40),
    ];

    it.each([
      ['west of UTC (Denver, UTC-7)', -7],
      ['east of UTC (Tokyo, UTC+9)', 9],
      ['far east of UTC (Kiritimati, UTC+14)', 14],
    ])('show the calendar day of each bucket %s', (_zone, offset) => {
      emulateUtcOffset(offset);

      render(week);

      expect(component.xTicks.map(t => t.label)).toEqual([
        '11/3',
        '11/4',
        '11/5',
        '11/6',
      ]);
    });

    it('show the calendar day in the timezone of the runner', () => {
      render([bucket('2026-01-01', 1, 1), bucket('2026-12-31', 1, 1)]);

      expect(component.xTicks.map(t => t.label)).toEqual(['1/1', '12/31']);
    });
  });
});

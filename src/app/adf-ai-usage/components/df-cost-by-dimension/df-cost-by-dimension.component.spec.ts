import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DfCostByDimensionComponent,
  DimensionSeriesPoint,
} from './df-cost-by-dimension.component';

const point = (
  date: string,
  bucket: string,
  cost: number
): DimensionSeriesPoint => ({ date, bucket, cost, requests: 1 });

/** What the page hands the chart for a backend row that carries no `date`
 *  (see MALFORMED_OTHER_ROW in df-ai-usage.component.spec.ts). */
const undated = (): DimensionSeriesPoint =>
  ({
    date: undefined,
    bucket: 'undefined',
    cost: 0,
    requests: 0,
  }) as unknown as DimensionSeriesPoint;

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

describe('DfCostByDimensionComponent', () => {
  let fixture: ComponentFixture<DfCostByDimensionComponent>;
  let component: DfCostByDimensionComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DfCostByDimensionComponent] });
    fixture = TestBed.createComponent(DfCostByDimensionComponent);
    component = fixture.componentInstance;
  });

  const render = (data: unknown) => {
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
  };
  const text = () => fixture.nativeElement.textContent.replace(/\s+/g, ' ');
  const emptyState = () => fixture.nativeElement.querySelector('.cbd__empty');

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty array', []],
  ])('renders the empty state for %s', (_label, data) => {
    expect(() => render(data)).not.toThrow();
    expect(component.layers).toEqual([]);
    expect(component.xTicks).toEqual([]);
    expect(emptyState()).not.toBeNull();
    expect(text()).toContain('No spend in this range yet.');
  });

  // Regression: /ai/usage threw "Cannot read properties of undefined
  // (reading 'slice')" from makeXTicks -> shortDate for a point with no date.
  it('renders the empty state when every point is undated', () => {
    expect(() => render([undated(), undated()])).not.toThrow();
    expect(component.layers).toEqual([]);
    expect(component.xTicks).toEqual([]);
    expect(emptyState()).not.toBeNull();
  });

  it('drops undated points and still charts the dated ones', () => {
    expect(() =>
      render([
        point('2026-11-03', 'alice', 2),
        undated(),
        point('2026-11-04', 'alice', 4),
        undated(),
      ])
    ).not.toThrow();

    expect(component.layers.map(l => l.label)).toEqual(['alice']);
    expect(component.layers[0].totalCost).toBe(6);
    expect(component.xTicks.map(t => t.label)).toEqual(['11/3', '11/4']);
    for (const tick of component.xTicks) {
      expect(Number.isFinite(tick.x)).toBe(true);
    }
    expect(emptyState()).toBeNull();
    expect(text()).not.toMatch(/NaN|undefined/);
  });

  it('keeps axes and shows the empty state when every cost is zero', () => {
    render([point('2026-11-03', 'alice', 0), point('2026-11-04', 'alice', 0)]);

    expect(component.layers).toEqual([]);
    expect(component.xTicks).toHaveLength(2);
    expect(component.yTicks.map(t => t.label)).toEqual(['$0']);
    expect(emptyState()).not.toBeNull();
  });

  it('charts a single day and keeps Other last in the legend', () => {
    render([
      point('2026-11-03', DfCostByDimensionComponent.OTHER_KEY, 9),
      point('2026-11-03', 'alice', 1),
    ]);

    expect(component.layers.map(l => l.label)).toEqual(['alice', 'Other']);
    expect(component.xTicks).toHaveLength(1);
    expect(component.yTicks).toHaveLength(3);
  });

  // Regression: the day came from new Date('YYYY-MM-DD'), which is midnight
  // UTC, read back with the local getters. West of UTC every label was one
  // day early (11-03 to 11-06 showed as 11/2 to 11/5 in Denver).
  describe('day labels', () => {
    afterEach(() => jest.restoreAllMocks());

    const week = ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'].map(
      (date, i) => point(date, 'alice', i + 1)
    );

    it.each([
      ['west of UTC (Denver, UTC-7)', -7],
      ['east of UTC (Tokyo, UTC+9)', 9],
      ['far east of UTC (Kiritimati, UTC+14)', 14],
    ])('show the calendar day of each point %s', (_zone, offset) => {
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
      render([
        point('2026-01-01', 'alice', 1),
        point('2026-12-31', 'alice', 1),
      ]);

      expect(component.xTicks.map(t => t.label)).toEqual(['1/1', '12/31']);
    });

    it('fall back to the text after the year for a non-date key', () => {
      render([point('2026-W45', 'alice', 1)]);

      expect(component.xTicks.map(t => t.label)).toEqual(['W45']);
    });
  });
});

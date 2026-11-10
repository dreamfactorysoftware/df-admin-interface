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

  // Regression: /ai/usage threw "Cannot read properties of undefined
  // (reading 'slice')" from makeXTicks -> shortDate for a point with no date.
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

  // Regression: the day came from new Date('YYYY-MM-DD'), which is midnight
  // UTC, read back with the local getters. West of UTC every label was one
  // day early. jest.tz-setup.js pins the runner to America/Denver.
  describe('day labels', () => {
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

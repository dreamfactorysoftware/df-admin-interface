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
    expect(component.xTicks).toHaveLength(2);
    for (const tick of component.xTicks) {
      expect(tick.label).toMatch(/^\d{1,2}\/\d{1,2}$/);
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
});

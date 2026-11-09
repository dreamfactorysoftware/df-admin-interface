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

const DAY_LABEL = /^\d{1,2}\/\d{1,2}$/;

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
    // Local-time labels: assert the shape, not the day, so the spec does
    // not depend on the runner's timezone.
    const labels = component.xTicks.map(t => t.label);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toMatch(DAY_LABEL);
    expect(labels[1]).toBe('');
    expect(labels[2]).toMatch(DAY_LABEL);
    expect(fixture.nativeElement.textContent).not.toContain('NaN');
    expect(emptyState()).toBeNull();
  });

  it('charts dated buckets with input and output layers', () => {
    render([bucket('2026-11-03', 100, 50), bucket('2026-11-04', 300, 100)]);

    expect(component.layers.map(l => [l.label, l.total])).toEqual([
      ['Input', 400],
      ['Output', 150],
    ]);
    expect(component.xTicks).toHaveLength(2);
    for (const tick of component.xTicks) {
      expect(tick.label).toMatch(DAY_LABEL);
    }
    expect(component.yTicks.map(t => t.label)).toEqual(['0', '200', '400']);
  });
});

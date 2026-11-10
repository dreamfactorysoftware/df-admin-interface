import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeBucket } from '../../types/usage';
import { DfUsageStackedAreaComponent } from './df-usage-stacked-area.component';

const bucket = (
  date: string,
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

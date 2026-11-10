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
  });
});

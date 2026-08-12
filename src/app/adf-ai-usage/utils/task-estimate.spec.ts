import {
  CalibrationBundle,
  MIN_CALIBRATION_REQUESTS,
  TOOL_LOOP,
  budgetVerdict,
  calibrate,
  compareActual,
  computeEstimate,
  roundTokens,
  usageCostDelta,
} from './task-estimate';

/** 10 metered calls: 20k in / 5k out, dominant model claude on anthropic,
 *  live rates present. Per-call averages: 2000 in / 500 out. */
function bundle(overrides: Partial<CalibrationBundle> = {}): CalibrationBundle {
  return {
    total_requests: 10,
    total_input_tokens: 20_000,
    total_output_tokens: 5_000,
    total_cost_usd: 0.5,
    by_model: [
      { model: 'gpt-4o', provider: 'openai', requests: 2 },
      { model: 'claude-sonnet-4-5', provider: 'anthropic', requests: 8 },
    ],
    by_provider: [{ provider: 'anthropic' }],
    default_rates: {
      anthropic: { input_per_1k: 0.003, output_per_1k: 0.015 },
      openai: { input_per_1k: 0.0025, output_per_1k: 0.01 },
    },
    ...overrides,
  };
}

describe('task-estimate', () => {
  describe('calibrate', () => {
    it('derives per-call averages and the dominant model from by_model', () => {
      const c = calibrate(bundle(), 'app');
      expect(c).not.toBeNull();
      expect(c!.requests).toBe(10);
      expect(c!.source).toBe('app');
      expect(c!.perCallInputTokens).toBe(2000);
      expect(c!.perCallOutputTokens).toBe(500);
      // Dominant by requests, not array order.
      expect(c!.model).toBe('claude-sonnet-4-5');
      expect(c!.provider).toBe('anthropic');
      expect(c!.rateSource).toBe('live');
      expect(c!.rates.inputPer1k).toBe(0.003);
      expect(c!.rates.outputPer1k).toBe(0.015);
    });

    it('coerces string numerics from the meter', () => {
      const c = calibrate(
        bundle({
          total_requests: '10',
          total_input_tokens: '20000',
          total_output_tokens: '5000',
        }),
        'service'
      );
      expect(c!.perCallInputTokens).toBe(2000);
      expect(c!.source).toBe('service');
    });

    it('returns null below the minimum metered history', () => {
      expect(
        calibrate(bundle({ total_requests: MIN_CALIBRATION_REQUESTS - 1 }), 'app')
      ).toBeNull();
      expect(calibrate(bundle({ total_requests: 0 }), 'app')).toBeNull();
    });

    it('blends a $/1k rate from cost totals when default_rates is missing', () => {
      const c = calibrate(bundle({ default_rates: undefined }), 'app');
      expect(c!.rateSource).toBe('blended');
      // 25k total tokens cost $0.50 → $0.02 per 1k, both directions.
      expect(c!.rates.inputPer1k).toBeCloseTo(0.02);
      expect(c!.rates.outputPer1k).toBeCloseTo(0.02);
    });

    it('falls back to by_provider when by_model rows carry no provider', () => {
      const c = calibrate(
        bundle({ by_model: [{ model: 'local-llm', requests: 10 }] }),
        'app'
      );
      expect(c!.provider).toBe('anthropic');
      expect(c!.rateSource).toBe('live');
    });

    it('returns null when there are no rates and no priced history', () => {
      expect(
        calibrate(
          bundle({ default_rates: undefined, total_cost_usd: 0 }),
          'app'
        )!.rates.inputPer1k
      ).toBe(0);
      // Zero tokens → nothing to blend from at all.
      expect(
        calibrate(
          bundle({
            default_rates: undefined,
            total_input_tokens: 0,
            total_output_tokens: 0,
          }),
          'app'
        )
      ).toBeNull();
    });
  });

  describe('computeEstimate', () => {
    it('scales per-call averages by the tool-loop range and prices both ends', () => {
      const c = calibrate(bundle(), 'app')!;
      const e = computeEstimate(c);
      expect(e.inputLow).toBe(2000 * TOOL_LOOP.low);
      expect(e.inputHigh).toBe(2000 * TOOL_LOOP.high);
      expect(e.outputLow).toBe(500 * TOOL_LOOP.low);
      expect(e.outputHigh).toBe(500 * TOOL_LOOP.high);
      // 6000/1k × 0.003 + 1500/1k × 0.015 = 0.018 + 0.0225
      expect(e.costLow).toBeCloseTo(0.0405);
      // 12000/1k × 0.003 + 3000/1k × 0.015 = 0.036 + 0.045
      expect(e.costHigh).toBeCloseTo(0.081);
      expect(e.costHigh).toBeGreaterThan(e.costLow);
    });
  });

  describe('roundTokens', () => {
    it('rounds to the nearest 100 tokens', () => {
      expect(roundTokens(14_327)).toBe(14_300);
      expect(roundTokens(14_350)).toBe(14_400);
      expect(roundTokens(49)).toBe(0);
    });
  });

  describe('budgetVerdict', () => {
    it('is "none" without a positive budget', () => {
      expect(budgetVerdict(0.08, null)).toBe('none');
      expect(budgetVerdict(0.08, undefined)).toBe('none');
      expect(budgetVerdict(0.08, 0)).toBe('none');
      expect(budgetVerdict(0.08, NaN)).toBe('none');
    });

    it('is "within" when even the high estimate fits the ceiling', () => {
      expect(budgetVerdict(0.08, 0.1)).toBe('within');
      expect(budgetVerdict(0.08, 0.08)).toBe('within');
    });

    it('is "over" when the high estimate exceeds the ceiling', () => {
      expect(budgetVerdict(0.081, 0.08)).toBe('over');
    });
  });

  describe('compareActual', () => {
    it('classifies a cost inside the range, bounds inclusive', () => {
      expect(compareActual(0.05, 0.04, 0.08)).toEqual({
        kind: 'within',
        pct: 0,
      });
      expect(compareActual(0.04, 0.04, 0.08).kind).toBe('within');
      expect(compareActual(0.08, 0.04, 0.08).kind).toBe('within');
    });

    it('reports percent overshoot vs the high estimate', () => {
      expect(compareActual(0.12, 0.04, 0.08)).toEqual({
        kind: 'above',
        pct: 50,
      });
    });

    it('reports percent undershoot vs the low estimate', () => {
      expect(compareActual(0.03, 0.04, 0.08)).toEqual({
        kind: 'below',
        pct: 25,
      });
    });

    it('never divides by a zero bound', () => {
      expect(compareActual(0.01, 0, 0)).toEqual({ kind: 'above', pct: 0 });
    });
  });

  describe('usageCostDelta', () => {
    it('subtracts pre from post, coercing strings', () => {
      expect(
        usageCostDelta({ total_cost_usd: '1.25' }, { total_cost_usd: '1.75' })
      ).toBeCloseTo(0.5);
    });

    it('treats a missing pre snapshot as zero spend', () => {
      expect(usageCostDelta(null, { total_cost_usd: 0.4 })).toBeCloseTo(0.4);
    });

    it('reads a missing post snapshot as no delta yet', () => {
      expect(usageCostDelta({ total_cost_usd: 1 }, null)).toBe(0);
    });
  });
});

import {
  DEFAULT_RATES,
  estimateCost,
  formatUSD,
  liveRates,
  rateFor,
  ratesFromBundle,
} from './cost';

/** `default_rates` as df-ai 0.1.0 and later serve it (DreamFactory 7.7). */
const NESTED = {
  providers: {
    anthropic: { input_per_1k: 0.004, output_per_1k: 0.02 },
    gemini: { input_per_1k: 0.0001, output_per_1k: 0.0004 },
    ollama: { input_per_1k: 0, output_per_1k: 0 },
  },
  models: {
    'claude-opus-4-8': { input_per_1k: 0.015, output_per_1k: 0.075 },
    'gpt-4.1-nano': { input_per_1k: 0.0001, output_per_1k: 0.0004 },
  },
};

/** The same provider rates as df-ai 0.0.x served them: a flat map. */
const FLAT = NESTED.providers;

describe('cost', () => {
  describe('estimateCost', () => {
    it('multiplies token counts by per-1k rates', () => {
      const cost = estimateCost(1000, 500, {
        provider: 'x',
        inputPer1k: 0.003,
        outputPer1k: 0.015,
      });
      expect(cost).toBeCloseTo(0.003 + 0.0075);
    });

    it('returns zero for zero rates (e.g. ollama)', () => {
      expect(estimateCost(1_000_000, 1_000_000, DEFAULT_RATES['ollama'])).toBe(
        0
      );
    });

    it('handles fractional thousands', () => {
      const cost = estimateCost(2500, 0, {
        provider: 'x',
        inputPer1k: 0.01,
        outputPer1k: 0,
      });
      expect(cost).toBeCloseTo(0.025);
    });
  });

  describe('formatUSD', () => {
    it('formats whole-dollar amounts without extra precision', () => {
      expect(formatUSD(123.45)).toBe('$123.45');
    });

    it('uses 4-decimal precision for sub-dollar amounts', () => {
      expect(formatUSD(0.1234)).toBe('$0.1234');
    });

    it('prints "<$0.01" for tiny non-zero amounts', () => {
      expect(formatUSD(0.001)).toBe('<$0.01');
    });

    it('prints $0.00 for zero', () => {
      expect(formatUSD(0)).toBe('$0.00');
    });

    it('handles non-finite gracefully', () => {
      expect(formatUSD(NaN)).toBe('$0.00');
      expect(formatUSD(Infinity)).toBe('$0.00');
    });
  });

  describe('ratesFromBundle', () => {
    // Regression: the nested shape was read as a flat provider map, which
    // produced two bogus "providers" and "models" entries with undefined
    // rates and left every real rate to the hardcoded fallback table.
    it('reads provider rates from the nested shape', () => {
      const rates = ratesFromBundle(NESTED);

      expect(rates['providers']).toBeUndefined();
      expect(rates['models']).toBeUndefined();
      // Served values, not the hardcoded fallback (0.003 / 0.015).
      expect(rates['anthropic']).toEqual({
        provider: 'anthropic',
        inputPer1k: 0.004,
        outputPer1k: 0.02,
      });
      // A provider the hardcoded table does not know.
      expect(rates['gemini']).toEqual({
        provider: 'gemini',
        inputPer1k: 0.0001,
        outputPer1k: 0.0004,
      });
      for (const r of Object.values(rates)) {
        expect(Number.isFinite(r.inputPer1k)).toBe(true);
        expect(Number.isFinite(r.outputPer1k)).toBe(true);
      }
    });

    it('still reads the flat shape of older backends', () => {
      const rates = ratesFromBundle(FLAT);

      expect(rates['anthropic']).toEqual({
        provider: 'anthropic',
        inputPer1k: 0.004,
        outputPer1k: 0.02,
      });
      expect(rates['gemini'].outputPer1k).toBe(0.0004);
    });

    it('gives the same provider table for both shapes', () => {
      expect(ratesFromBundle(NESTED)).toEqual(ratesFromBundle(FLAT));
    });

    it('keeps the fallback for providers the backend does not list', () => {
      expect(ratesFromBundle(NESTED)['xai']).toEqual(DEFAULT_RATES['xai']);
      expect(ratesFromBundle(FLAT)['openai']).toEqual(DEFAULT_RATES['openai']);
    });

    it('returns the fallback table when nothing was served', () => {
      expect(ratesFromBundle(undefined)).toBe(DEFAULT_RATES);
      expect(ratesFromBundle({})).toEqual(DEFAULT_RATES);
      expect(ratesFromBundle({ providers: {}, models: {} })).toEqual(
        DEFAULT_RATES
      );
    });

    it('drops entries that carry no numeric rates', () => {
      const rates = ratesFromBundle({
        broken: { input_per_1k: 'n/a', output_per_1k: '' },
        anthropic: { input_per_1k: '0.004', output_per_1k: '0.02' },
      });

      expect(rates['broken']).toBeUndefined();
      expect(rates['anthropic'].inputPer1k).toBe(0.004);
    });
  });

  describe('liveRates', () => {
    it('splits the nested shape into provider and model rates', () => {
      const live = liveRates(NESTED);

      expect(Object.keys(live.providers)).toEqual([
        'anthropic',
        'gemini',
        'ollama',
      ]);
      expect(live.models['claude-opus-4-8']).toEqual({
        inputPer1k: 0.015,
        outputPer1k: 0.075,
      });
    });

    it('reads the flat shape as provider rates with no model rates', () => {
      const live = liveRates(FLAT);

      expect(Object.keys(live.providers)).toEqual([
        'anthropic',
        'gemini',
        'ollama',
      ]);
      expect(live.models).toEqual({});
    });

    it('reads a flat map that prices a provider named "models" as flat', () => {
      const live = liveRates({
        models: { input_per_1k: 0.001, output_per_1k: 0.002 },
        anthropic: { input_per_1k: 0.004, output_per_1k: 0.02 },
      });

      expect(Object.keys(live.providers)).toEqual(['models', 'anthropic']);
      expect(live.models).toEqual({});
    });

    it('is empty for a missing or empty payload', () => {
      const empty = { providers: {}, models: {} };
      expect(liveRates(undefined)).toEqual(empty);
      expect(liveRates(null)).toEqual(empty);
      expect(liveRates({})).toEqual(empty);
    });
  });

  describe('rateFor', () => {
    it('only resolves own keys', () => {
      const { models } = liveRates(NESTED);

      expect(rateFor(models, 'gpt-4.1-nano')?.inputPer1k).toBe(0.0001);
      expect(rateFor(models, 'constructor')).toBeUndefined();
      expect(rateFor(models, 'unknown-model')).toBeUndefined();
      expect(rateFor(models, null)).toBeUndefined();
    });
  });

  describe('DEFAULT_RATES', () => {
    it('has rates for every provider DF supports', () => {
      for (const p of [
        'anthropic',
        'openai',
        'xai',
        'ollama',
        'openai_compatible',
      ]) {
        expect(DEFAULT_RATES[p]).toBeDefined();
        expect(typeof DEFAULT_RATES[p].inputPer1k).toBe('number');
        expect(typeof DEFAULT_RATES[p].outputPer1k).toBe('number');
      }
    });
  });
});

import { DEFAULT_RATES, estimateCost, formatUSD } from './cost';

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

import { ProviderRates } from '../types/usage';

/**
 * Last-resort fallback if the dashboard endpoint hasn't returned default
 * rates yet (e.g. the request errored, or the bundle is mid-load). The
 * authoritative table lives in df-ai's UsageRates::DEFAULT_RATES and is
 * served via /_internal/ai/usage as `default_rates`. Keep these values
 * in sync ONLY for empty-bundle scenarios; never edit one without the
 * other.
 */
const FALLBACK_RATES: Record<string, ProviderRates> = {
  anthropic: { provider: 'anthropic', inputPer1k: 0.003, outputPer1k: 0.015 },
  openai: { provider: 'openai', inputPer1k: 0.0025, outputPer1k: 0.01 },
  xai: { provider: 'xai', inputPer1k: 0.002, outputPer1k: 0.01 },
  ollama: { provider: 'ollama', inputPer1k: 0, outputPer1k: 0 },
  openai_compatible: {
    provider: 'openai_compatible',
    inputPer1k: 0,
    outputPer1k: 0,
  },
};

/**
 * Convert the snake_case shape served by /_internal/ai/usage's
 * `default_rates` field into the camelCase ProviderRates shape used by the
 * cost-estimator's table. Caller passes the value out of `bundle.raw`.
 */
export function ratesFromBundle(
  defaultRates:
    | Record<string, { input_per_1k: number; output_per_1k: number }>
    | undefined
): Record<string, ProviderRates> {
  if (!defaultRates) {
    return FALLBACK_RATES;
  }
  const out: Record<string, ProviderRates> = {};
  for (const [provider, r] of Object.entries(defaultRates)) {
    out[provider] = {
      provider,
      inputPer1k: r.input_per_1k,
      outputPer1k: r.output_per_1k,
    };
  }
  // Merge in fallback for any provider the backend didn't list — keeps the
  // estimator from breaking if a new provider gets added before the
  // backend's default_rates table catches up.
  return { ...FALLBACK_RATES, ...out };
}

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  rates: ProviderRates
): number {
  return (
    (inputTokens / 1000) * rates.inputPer1k +
    (outputTokens / 1000) * rates.outputPer1k
  );
}

export function formatUSD(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }
  if (value < 0.01 && value > 0) {
    return '<$0.01';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

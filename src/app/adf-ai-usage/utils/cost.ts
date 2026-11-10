import { ProviderRates } from '../types/usage';

/**
 * Last-resort fallback if the dashboard endpoint hasn't returned default
 * rates yet (e.g. the request errored, or the bundle is mid-load). The
 * authoritative table lives in df-ai's UsageRates::DEFAULT_RATES and is
 * served via /_internal/ai/usage as `default_rates`. Keep these values
 * in sync ONLY for empty-bundle scenarios; never edit one without the
 * other.
 */
export const DEFAULT_RATES: Record<string, ProviderRates> = {
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

/** One rate entry as served by df-ai (USD per 1k tokens). */
export interface RateEntryRaw {
  input_per_1k: number | string;
  output_per_1k: number | string;
}

/**
 * `default_rates` as served by /_internal/ai/usage. Two shapes are in the
 * field and both must keep working:
 *   - df-ai 0.1.0 and later (DreamFactory 7.7): provider rates and per-model
 *     rates, `{ providers: {...}, models: {...} }`.
 *   - df-ai 0.0.x: a flat provider map, `{ anthropic: {...}, ... }`.
 */
export type DefaultRatesRaw =
  | Record<string, RateEntryRaw>
  | {
      providers?: Record<string, RateEntryRaw>;
      models?: Record<string, RateEntryRaw>;
    };

export interface RatePair {
  inputPer1k: number;
  outputPer1k: number;
}

/** `default_rates` in one shape, whichever one the backend sent. */
export interface LiveRates {
  providers: Record<string, RatePair>;
  models: Record<string, RatePair>;
}

function rateNumber(v: unknown): number {
  if (typeof v === 'number') {
    return v;
  }
  return typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
}

function ratePair(v: unknown): RatePair | null {
  if (!v || typeof v !== 'object') {
    return null;
  }
  const inputPer1k = rateNumber((v as Partial<RateEntryRaw>).input_per_1k);
  const outputPer1k = rateNumber((v as Partial<RateEntryRaw>).output_per_1k);
  return Number.isFinite(inputPer1k) && Number.isFinite(outputPer1k)
    ? { inputPer1k, outputPer1k }
    : null;
}

function collectRates(map: unknown): Record<string, RatePair> {
  // No prototype, so a model named "constructor" never resolves to an
  // inherited member.
  const out: Record<string, RatePair> = Object.create(null);
  if (!map || typeof map !== 'object') {
    return out;
  }
  for (const [name, entry] of Object.entries(map)) {
    const pair = ratePair(entry);
    if (pair) {
      out[name] = pair;
    }
  }
  return out;
}

/**
 * Read `default_rates` in either served shape. The payload is nested when
 * `providers` or `models` holds a map rather than a rate entry, so a flat
 * map that prices a provider literally named "providers" still reads as
 * flat. Entries without two numeric rates are dropped.
 */
export function liveRates(raw: DefaultRatesRaw | null | undefined): LiveRates {
  const r = (raw ?? {}) as Record<string, unknown>;
  const nested = [r['providers'], r['models']].some(
    v => !!v && typeof v === 'object' && !ratePair(v)
  );
  return nested
    ? {
        providers: collectRates(r['providers']),
        models: collectRates(r['models']),
      }
    : { providers: collectRates(r), models: {} };
}

/**
 * Convert the provider rates served by /_internal/ai/usage's
 * `default_rates` field into the camelCase ProviderRates shape used by the
 * cost-estimator's table. Caller passes the value out of `bundle.raw`.
 */
export function ratesFromBundle(
  defaultRates: DefaultRatesRaw | null | undefined
): Record<string, ProviderRates> {
  if (!defaultRates) {
    return DEFAULT_RATES;
  }
  const out: Record<string, ProviderRates> = {};
  for (const [provider, r] of Object.entries(
    liveRates(defaultRates).providers
  )) {
    out[provider] = { provider, ...r };
  }
  // Merge in fallback for any provider the backend didn't list — keeps the
  // estimator from breaking if a new provider gets added before the
  // backend's default_rates table catches up.
  return { ...DEFAULT_RATES, ...out };
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

/** Shared formatter instances — Intl.NumberFormat construction is expensive
 *  (locale data lookup), so never build one per call in code reachable from
 *  templates (it would run on every change-detection cycle). */
export const USD_2DP = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
export const USD_4DP = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4,
});

export function formatUSD(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }
  if (value < 0.01 && value > 0) {
    return '<$0.01';
  }
  return (value < 1 ? USD_4DP : USD_2DP).format(value);
}

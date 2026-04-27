import { ProviderRates } from '../types/usage';

/**
 * Default per-1k-token costs for the providers DF supports. Conservative
 * mid-tier estimates as of 2026-04 — admins can override per-row in the UI.
 * Values are USD per 1000 tokens.
 */
export const DEFAULT_RATES: Record<string, ProviderRates> = {
  anthropic: {
    provider: 'anthropic',
    inputPer1k: 0.003,
    outputPer1k: 0.015,
  },
  openai: {
    provider: 'openai',
    inputPer1k: 0.0025,
    outputPer1k: 0.01,
  },
  xai: {
    provider: 'xai',
    inputPer1k: 0.002,
    outputPer1k: 0.01,
  },
  ollama: {
    provider: 'ollama',
    inputPer1k: 0,
    outputPer1k: 0,
  },
  openai_compatible: {
    provider: 'openai_compatible',
    inputPer1k: 0.0025,
    outputPer1k: 0.01,
  },
};

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

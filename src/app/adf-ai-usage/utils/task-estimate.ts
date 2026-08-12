import { ProviderRates } from '../types/usage';
import { estimateCost } from './cost';

/**
 * Pure math for the task cost estimator: calibrate per-call token averages
 * from a metered usage window, project a low/high cost range for one agent
 * task, judge it against an optional budget, and classify the actual spend
 * after a real run. No HTTP, no Angular — fully unit-testable.
 */

/**
 * How many model calls one agent task fans out into via the tool loop.
 * Empirically measured calls-per-task range (July 2026): a routed task
 * lands between 3 and 6 provider calls (plan → tool call(s) → final
 * answer). This is why the estimate is a RANGE, not a quote.
 */
export const TOOL_LOOP = { low: 3, high: 6 } as const;

/** Below this many metered requests an average is noise, not signal. */
export const MIN_CALIBRATION_REQUESTS = 5;

/**
 * The slice of an /_internal/ai/usage response that calibration reads.
 * Structural subset of `UsageResponse` (services/usage.service), kept
 * minimal so tests can build fixtures without 30 unrelated fields. The
 * meter may serve numerics as strings (DB-driver dependent) — coerced here.
 */
export interface CalibrationBundle {
  total_requests: number | string;
  total_input_tokens: number | string;
  total_output_tokens: number | string;
  total_cost_usd: number | string;
  by_model?: {
    model: string;
    provider?: string;
    requests: number | string;
  }[];
  by_provider?: { provider?: string }[];
  default_rates?: Record<
    string,
    { input_per_1k: number; output_per_1k: number }
  >;
}

/** Which usage window produced the calibration: the routed agent's backing
 *  app, or the target chat service's wider history (the <5-rows fallback). */
export type CalibrationSource = 'app' | 'service';

export interface TaskCalibration {
  /** Metered requests the averages were derived from. */
  requests: number;
  source: CalibrationSource;
  perCallInputTokens: number;
  perCallOutputTokens: number;
  /** Dominant model/provider by request count in the window. */
  model: string | null;
  provider: string | null;
  rates: ProviderRates;
  /** 'live' = the meter's default_rates for the dominant provider;
   *  'blended' = $/1k derived from the window's own cost/token totals
   *  (data-driven fallback — never a third hardcoded rate table). */
  rateSource: 'live' | 'blended';
}

/** Coerce a possibly-string numeric from the meter. Local twin of the
 *  service-layer `n()` so this module stays free of service imports. */
function num(v: number | string | undefined | null): number {
  const x = typeof v === 'string' ? Number(v) : (v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

/**
 * Derive per-call token averages + a $/1k rate from one usage window.
 * Returns null when the window can't honestly calibrate anything: fewer
 * than MIN_CALIBRATION_REQUESTS metered rows, or no rates AND no priced
 * history to blend from. Callers chain windows (app → service) and show
 * "Not enough metered history" only after every source returns null.
 */
export function calibrate(
  bundle: CalibrationBundle,
  source: CalibrationSource
): TaskCalibration | null {
  const requests = num(bundle.total_requests);
  if (requests < MIN_CALIBRATION_REQUESTS) {
    return null;
  }

  // Dominant model = most requests in the window.
  let top: { model: string; provider?: string; requests: number | string } | null =
    null;
  for (const m of bundle.by_model ?? []) {
    if (!top || num(m.requests) > num(top.requests)) {
      top = m;
    }
  }
  const provider = top?.provider ?? bundle.by_provider?.[0]?.provider ?? null;

  const live = provider ? bundle.default_rates?.[provider] : undefined;
  let rates: ProviderRates;
  let rateSource: TaskCalibration['rateSource'];
  if (
    live &&
    Number.isFinite(Number(live.input_per_1k)) &&
    Number.isFinite(Number(live.output_per_1k))
  ) {
    rates = {
      provider: provider as string,
      inputPer1k: Number(live.input_per_1k),
      outputPer1k: Number(live.output_per_1k),
    };
    rateSource = 'live';
  } else {
    const totalTokens =
      num(bundle.total_input_tokens) + num(bundle.total_output_tokens);
    const blended =
      totalTokens > 0 ? num(bundle.total_cost_usd) / (totalTokens / 1000) : NaN;
    if (!Number.isFinite(blended)) {
      // No rates and no priced history — inventing numbers would be worse
      // than admitting we can't estimate.
      return null;
    }
    rates = {
      provider: provider ?? 'blended',
      inputPer1k: blended,
      outputPer1k: blended,
    };
    rateSource = 'blended';
  }

  return {
    requests,
    source,
    perCallInputTokens: num(bundle.total_input_tokens) / requests,
    perCallOutputTokens: num(bundle.total_output_tokens) / requests,
    model: top?.model ?? null,
    provider,
    rates,
    rateSource,
  };
}

export interface TaskEstimate {
  inputLow: number;
  inputHigh: number;
  outputLow: number;
  outputHigh: number;
  costLow: number;
  costHigh: number;
}

/** Project one task's token + cost range: per-call averages × the observed
 *  TOOL_LOOP calls-per-task range, priced through the shared estimateCost. */
export function computeEstimate(calib: TaskCalibration): TaskEstimate {
  const inputLow = calib.perCallInputTokens * TOOL_LOOP.low;
  const inputHigh = calib.perCallInputTokens * TOOL_LOOP.high;
  const outputLow = calib.perCallOutputTokens * TOOL_LOOP.low;
  const outputHigh = calib.perCallOutputTokens * TOOL_LOOP.high;
  return {
    inputLow,
    inputHigh,
    outputLow,
    outputHigh,
    costLow: estimateCost(inputLow, outputLow, calib.rates),
    costHigh: estimateCost(inputHigh, outputHigh, calib.rates),
  };
}

/** Nearest-100 token rounding for display — it's an estimate, and showing
 *  "14,327 tokens" would imply a precision the math doesn't have. */
export function roundTokens(v: number): number {
  return Math.round(v / 100) * 100;
}

export type BudgetVerdict = 'none' | 'within' | 'over';

/** Judge the worst-case estimate against an optional budget ceiling. The
 *  verdict is advisory — callers must warn on 'over', never hard-block. */
export function budgetVerdict(
  costHigh: number,
  budget: number | null | undefined
): BudgetVerdict {
  if (budget == null || !Number.isFinite(budget) || budget <= 0) {
    return 'none';
  }
  return costHigh <= budget ? 'within' : 'over';
}

export interface ActualComparison {
  kind: 'within' | 'above' | 'below';
  /** Whole-percent overshoot vs high (above) or undershoot vs low (below);
   *  0 when within range or the reference bound is zero. */
  pct: number;
}

/** Classify a real run's metered cost against the pre-run low/high range. */
export function compareActual(
  actual: number,
  costLow: number,
  costHigh: number
): ActualComparison {
  if (actual >= costLow && actual <= costHigh) {
    return { kind: 'within', pct: 0 };
  }
  if (actual > costHigh) {
    return {
      kind: 'above',
      pct: costHigh > 0 ? Math.round(((actual - costHigh) / costHigh) * 100) : 0,
    };
  }
  return {
    kind: 'below',
    pct: costLow > 0 ? Math.round(((costLow - actual) / costLow) * 100) : 0,
  };
}

/** Spend delta between two meter snapshots (post − pre). A missing post
 *  snapshot reads as 0 — "the meter hasn't caught up", never negative. */
export function usageCostDelta(
  pre: { total_cost_usd: number | string } | null | undefined,
  post: { total_cost_usd: number | string } | null | undefined
): number {
  if (!post) {
    return 0;
  }
  return num(post.total_cost_usd) - num(pre?.total_cost_usd);
}

import {
  GroupBy,
  GroupRow,
  TimeBucket,
  TimeRange,
  UsageSessionRow,
  UsageSummary,
} from '../types/usage';

/** Truncate an ISO datetime to YYYY-MM-DD in local time. */
function dayBucket(iso: string | undefined | null): string | null {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Inclusive lower-bound timestamp for a TimeRange. */
export function rangeFloor(range: TimeRange, now = new Date()): Date | null {
  if (range === 'all') {
    return null;
  }
  const ms = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }[range];
  return new Date(now.getTime() - ms);
}

/** Filter sessions by their updated_at against a TimeRange. */
export function filterByRange(
  sessions: UsageSessionRow[],
  range: TimeRange,
  now = new Date()
): UsageSessionRow[] {
  const floor = rangeFloor(range, now);
  if (!floor) {
    return sessions;
  }
  const floorMs = floor.getTime();
  return sessions.filter(s => {
    const t = s.updated_at ?? s.created_at;
    if (!t) {
      return false;
    }
    const ts = new Date(t).getTime();
    return Number.isFinite(ts) && ts >= floorMs;
  });
}

export function summarize(sessions: UsageSessionRow[]): UsageSummary {
  let inputTokens = 0;
  let outputTokens = 0;
  let toolCalls = 0;
  for (const s of sessions) {
    inputTokens += s.total_input_tokens ?? 0;
    outputTokens += s.total_output_tokens ?? 0;
    toolCalls += s.tool_call_count ?? 0;
  }
  const sessionCount = sessions.length;
  const totalTokens = inputTokens + outputTokens;
  return {
    sessionCount,
    inputTokens,
    outputTokens,
    totalTokens,
    toolCalls,
    avgTokensPerSession: sessionCount ? Math.round(totalTokens / sessionCount) : 0,
    avgToolCallsPerSession: sessionCount
      ? Math.round((toolCalls / sessionCount) * 10) / 10
      : 0,
  };
}

/** Build a daily time series from session rows. Fills missing days with zeros. */
export function timeSeries(
  sessions: UsageSessionRow[],
  range: TimeRange,
  now = new Date()
): TimeBucket[] {
  const buckets = new Map<string, TimeBucket>();

  for (const s of sessions) {
    const day = dayBucket(s.updated_at ?? s.created_at);
    if (!day) {
      continue;
    }
    const b = buckets.get(day) ?? {
      date: day,
      inputTokens: 0,
      outputTokens: 0,
      toolCalls: 0,
      sessions: 0,
    };
    b.inputTokens += s.total_input_tokens ?? 0;
    b.outputTokens += s.total_output_tokens ?? 0;
    b.toolCalls += s.tool_call_count ?? 0;
    b.sessions += 1;
    buckets.set(day, b);
  }

  // Fill in zero-buckets for missing days within the range so charts don't gap.
  const days: TimeBucket[] = [];
  const floor = rangeFloor(range, now) ?? earliestDate(buckets);
  if (!floor) {
    return Array.from(buckets.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }
  const cursor = new Date(floor);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= end.getTime()) {
    const day = dayBucket(cursor.toISOString())!;
    days.push(
      buckets.get(day) ?? {
        date: day,
        inputTokens: 0,
        outputTokens: 0,
        toolCalls: 0,
        sessions: 0,
      }
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function earliestDate(buckets: Map<string, TimeBucket>): Date | null {
  let earliest: string | null = null;
  for (const k of buckets.keys()) {
    if (!earliest || k < earliest) {
      earliest = k;
    }
  }
  return earliest ? new Date(earliest) : null;
}

/** Group sessions by user / role / service and compute totals. */
export function groupBy(
  sessions: UsageSessionRow[],
  by: GroupBy,
  labels: {
    users?: Map<number, string>;
    roles?: Map<number, string>;
  } = {}
): GroupRow[] {
  const map = new Map<string, GroupRow>();

  for (const s of sessions) {
    const { key, label } = keyAndLabel(s, by, labels);
    const row = map.get(key) ?? {
      key,
      label,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      toolCalls: 0,
      sessions: 0,
    };
    row.inputTokens += s.total_input_tokens ?? 0;
    row.outputTokens += s.total_output_tokens ?? 0;
    row.totalTokens = row.inputTokens + row.outputTokens;
    row.toolCalls += s.tool_call_count ?? 0;
    row.sessions += 1;
    map.set(key, row);
  }

  return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens);
}

function keyAndLabel(
  s: UsageSessionRow,
  by: GroupBy,
  labels: { users?: Map<number, string>; roles?: Map<number, string> }
): { key: string; label: string } {
  if (by === 'user') {
    const id = s.user_id ?? 0;
    const fallback = id ? `user #${id}` : 'anonymous';
    return {
      key: String(id),
      label: labels.users?.get(id) ?? fallback,
    };
  }
  if (by === 'role') {
    const id = s.ai_role_id ?? 0;
    return {
      key: String(id),
      label: labels.roles?.get(id) ?? `role #${id}`,
    };
  }
  // service
  return {
    key: s.service_name,
    label: s.service_label || s.service_name,
  };
}

import { UsageSessionRow } from '../types/usage';
import {
  filterByRange,
  groupBy,
  rangeFloor,
  summarize,
  timeSeries,
} from './aggregate';

function s(over: Partial<UsageSessionRow>): UsageSessionRow {
  return {
    id: 1,
    service_id: 1,
    ai_service_id: 1,
    ai_role_id: 12,
    status: 'active',
    service_name: 'demo',
    service_label: 'Demo',
    user_id: 1,
    total_input_tokens: 0,
    total_output_tokens: 0,
    tool_call_count: 0,
    updated_at: '2026-04-27T12:00:00Z',
    ...over,
  };
}

describe('aggregate', () => {
  describe('rangeFloor', () => {
    const NOW = new Date('2026-04-27T12:00:00Z');

    it('returns null for "all"', () => {
      expect(rangeFloor('all', NOW)).toBeNull();
    });

    it('subtracts the right window', () => {
      expect(rangeFloor('24h', NOW)?.toISOString()).toBe(
        '2026-04-26T12:00:00.000Z'
      );
      expect(rangeFloor('7d', NOW)?.toISOString()).toBe(
        '2026-04-20T12:00:00.000Z'
      );
      expect(rangeFloor('30d', NOW)?.toISOString()).toBe(
        '2026-03-28T12:00:00.000Z'
      );
    });
  });

  describe('filterByRange', () => {
    const NOW = new Date('2026-04-27T12:00:00Z');
    const sessions = [
      s({ id: 1, updated_at: '2026-04-27T11:00:00Z' }), // 1h ago
      s({ id: 2, updated_at: '2026-04-26T11:00:00Z' }), // 25h ago
      s({ id: 3, updated_at: '2026-04-19T11:00:00Z' }), // 8d ago
    ];

    it('"all" returns everything', () => {
      expect(filterByRange(sessions, 'all', NOW).length).toBe(3);
    });

    it('"24h" keeps only the most recent', () => {
      expect(filterByRange(sessions, '24h', NOW).map(s => s.id)).toEqual([1]);
    });

    it('"7d" drops the 8-day-old session', () => {
      expect(filterByRange(sessions, '7d', NOW).map(s => s.id)).toEqual([1, 2]);
    });

    it('drops sessions with no timestamp', () => {
      const orphan = s({ id: 4, updated_at: undefined, created_at: undefined });
      expect(filterByRange([orphan], '24h', NOW)).toEqual([]);
    });
  });

  describe('summarize', () => {
    it('zeros for an empty list', () => {
      expect(summarize([])).toEqual({
        sessionCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        toolCalls: 0,
        avgTokensPerSession: 0,
        avgToolCallsPerSession: 0,
      });
    });

    it('aggregates token + tool counts and rounds averages', () => {
      const summary = summarize([
        s({
          total_input_tokens: 100,
          total_output_tokens: 200,
          tool_call_count: 1,
        }),
        s({
          total_input_tokens: 200,
          total_output_tokens: 400,
          tool_call_count: 4,
        }),
      ]);
      expect(summary.sessionCount).toBe(2);
      expect(summary.inputTokens).toBe(300);
      expect(summary.outputTokens).toBe(600);
      expect(summary.totalTokens).toBe(900);
      expect(summary.toolCalls).toBe(5);
      expect(summary.avgTokensPerSession).toBe(450);
      expect(summary.avgToolCallsPerSession).toBe(2.5);
    });
  });

  describe('timeSeries', () => {
    const NOW = new Date('2026-04-27T12:00:00Z');

    it('returns empty for empty input + "all"', () => {
      expect(timeSeries([], 'all', NOW)).toEqual([]);
    });

    it('fills missing days with zero buckets', () => {
      const ts = timeSeries(
        [
          s({
            updated_at: '2026-04-25T10:00:00Z',
            total_input_tokens: 50,
          }),
          s({
            updated_at: '2026-04-27T10:00:00Z',
            total_input_tokens: 100,
          }),
        ],
        '7d',
        NOW
      );
      // 7 days back from 04-27 inclusive = 8 days
      expect(ts.length).toBe(8);
      const map: Record<string, number> = {};
      ts.forEach(b => (map[b.date] = b.inputTokens));
      // The two days with data
      expect(map).toMatchObject({
        '2026-04-25': 50,
        '2026-04-27': 100,
      });
      // Days with no data are present as zeros (sample one)
      expect(map['2026-04-26']).toBe(0);
    });
  });

  describe('groupBy', () => {
    const sessions: UsageSessionRow[] = [
      s({ user_id: 1, total_input_tokens: 100, total_output_tokens: 50 }),
      s({ user_id: 1, total_input_tokens: 200, total_output_tokens: 100 }),
      s({ user_id: 2, total_input_tokens: 50, total_output_tokens: 25 }),
    ];

    it('groups by user and sorts by total tokens descending', () => {
      const rows = groupBy(sessions, 'user', {
        users: new Map([
          [1, 'Alice'],
          [2, 'Bob'],
        ]),
      });
      expect(rows.length).toBe(2);
      expect(rows[0].label).toBe('Alice');
      expect(rows[0].totalTokens).toBe(450);
      expect(rows[0].sessions).toBe(2);
      expect(rows[1].label).toBe('Bob');
      expect(rows[1].totalTokens).toBe(75);
    });

    it('falls back to "user #N" when name is missing', () => {
      const rows = groupBy(sessions, 'user');
      expect(rows[0].label).toMatch(/user #/);
    });

    it('groups by service using the row label', () => {
      const rows = groupBy(
        [
          s({ service_name: 'a', service_label: 'A', total_input_tokens: 10 }),
          s({ service_name: 'a', service_label: 'A', total_input_tokens: 20 }),
          s({ service_name: 'b', service_label: 'B', total_input_tokens: 100 }),
        ],
        'service'
      );
      expect(rows.map(r => r.key)).toEqual(['b', 'a']);
      expect(rows.find(r => r.key === 'a')?.sessions).toBe(2);
      expect(rows.find(r => r.key === 'a')?.label).toBe('A');
    });
  });
});

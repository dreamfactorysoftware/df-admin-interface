import { MAX_TICKS, compressStrip } from './df-sensitivity-strip.component';
import { StripMark } from '../data-masking.types';

const item = (mark: StripMark, i: number) => ({
  column: `c${i}`,
  mark,
  tier: mark === 'review' ? ('identity' as const) : null,
});

describe('compressStrip', () => {
  it('keeps narrow tables as they are', () => {
    const items = Array.from({ length: 10 }, (_, i) => item('clear', i));
    expect(compressStrip(items)).toBe(items);
  });

  it('squeezes clear runs and keeps every sensitive tick when that fits', () => {
    const items = Array.from({ length: 200 }, (_, i) =>
      item(i % 20 === 0 ? 'restricted' : 'clear', i)
    );
    const out = compressStrip(items);
    expect(out.length).toBeLessThanOrEqual(MAX_TICKS);
    expect(out.filter(s => s.mark === 'restricted').length).toBe(10);
  });

  it('never draws more than MAX_TICKS, even when most columns are sensitive', () => {
    // 40 sensitive columns used to give 40+ ticks and cover the badge.
    const items = Array.from({ length: 60 }, (_, i) =>
      item(i % 3 === 0 ? 'clear' : i % 2 ? 'identity' : 'quasi', i)
    );
    const out = compressStrip(items);
    expect(out.length).toBe(MAX_TICKS);
    // Sensitive data never disappears into grey.
    expect(out.every(s => s.mark !== 'clear')).toBe(true);
  });

  it('a shared tick shows the strictest column it stands for', () => {
    const items = Array.from({ length: 48 }, (_, i) =>
      item(i === 47 ? 'restricted' : 'quasi', i)
    );
    const out = compressStrip(items);
    expect(out.length).toBe(MAX_TICKS);
    expect(out[MAX_TICKS - 1].mark).toBe('restricted');
  });
});

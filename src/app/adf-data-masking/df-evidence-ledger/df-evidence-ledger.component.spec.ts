import { receiptLines } from './df-evidence-ledger.component';
import { Evidence, EvidenceLine } from '../data-masking.types';

const line = (
  points: number,
  text: string,
  kind: EvidenceLine['kind'] = 'name'
): EvidenceLine => ({ points, kind, text });

const ev = (total: number, lines: EvidenceLine[]): Evidence => ({
  total,
  thresholdMask: 70,
  thresholdReview: 40,
  lines,
});

describe('receiptLines', () => {
  it('drops zero-point lines while the scored lines add up to the total', () => {
    const lines = [
      line(70, 'Column name "dni"'),
      line(0, '"key id" rules out credential', 'context'),
      line(75, '256 of 256 values are valid Spanish DNIs', 'values'),
    ];
    // 145 caps at 100: the receipt still adds up.
    expect(receiptLines(ev(100, lines)).map(l => l.points)).toEqual([70, 75]);
  });

  it('keeps every line when a zero-point line explains the total', () => {
    // Live: a strong name pulled down by values that do not match it.
    const lines = [
      line(70, 'Column name "client_ip"'),
      line(0, '0 of 256 values are IPv4 addresses', 'values'),
    ];
    expect(receiptLines(ev(30, lines))).toEqual(lines);
  });

  it('shows the zero-point lines when nothing scored', () => {
    const lines = [line(0, 'Key column, never classified', 'context')];
    expect(receiptLines(ev(0, lines))).toEqual(lines);
  });

  it('copes with missing evidence', () => {
    expect(receiptLines(null)).toEqual([]);
    expect(receiptLines(ev(0, []))).toEqual([]);
  });
});

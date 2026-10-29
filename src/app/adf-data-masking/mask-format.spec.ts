import {
  MASK_GLYPH,
  TOKEN_RE,
  applyMask,
  sampleMask,
  segmentMasked,
} from './mask-format';

const G = MASK_GLYPH;

describe('mask-format', () => {
  it('last4 keeps separators and the last four characters', () => {
    expect(applyMask('123-45-6789', 'last4', 'national_id')).toBe(
      `${G}${G}${G}-${G}${G}-6789`
    );
  });

  it('first letter keeps the shape of an email', () => {
    expect(applyMask('jane@example.com', 'initial', 'email')).toBe(
      `j${G}${G}${G}@${G.repeat(7)}.com`
    );
  });

  it('year only keeps the year of a date', () => {
    expect(applyMask('1984-03-12', 'year', 'date_of_birth')).toBe(
      `1984-${G}${G}-${G}${G}`
    );
  });

  it('token is stable and typed', () => {
    const a = applyMask('jane@example.com', 'token', 'email');
    expect(a).toMatch(/^EMAIL_[0-9a-f]{8}$/);
    expect(applyMask('jane@example.com', 'token', 'email')).toBe(a);
  });

  it('null returns null and redact hides length', () => {
    expect(applyMask('x', 'null', 'email')).toBeNull();
    expect(applyMask('a much longer secret', 'redact', 'credential')).toBe(
      G.repeat(8)
    );
  });

  it('span masks only personal data inside free text', () => {
    const out = sampleMask('free_text_pii', 'span').after as string;
    expect(out.startsWith('Call Jane at ')).toBe(true);
    expect(out).not.toContain('@');
    expect(out).not.toContain('555');
  });

  it('uses the server mask glyph (U+2022)', () => {
    expect(MASK_GLYPH).toBe('\u2022');
    expect(applyMask('123-45-6789', 'last4', 'national_id')).toBe(
      '\u2022\u2022\u2022-\u2022\u2022-6789'
    );
  });

  it('accepts server tokens (PREFIX_ + 8 hex) and nothing that looks raw', () => {
    expect(TOKEN_RE.test('EMAIL_7f3a91c2')).toBe(true);
    expect(TOKEN_RE.test('NID_0a1b')).toBe(true);
    expect(TOKEN_RE.test('EMAIL_7F3A91C2')).toBe(false);
    expect(TOKEN_RE.test('jane@example.com')).toBe(false);
    expect(TOKEN_RE.test('EMAIL_' + 'a'.repeat(17))).toBe(false);
  });

  it('segments runs of the glyph into bars', () => {
    expect(segmentMasked(`${G}${G}-4821`)).toEqual([
      { kind: 'bar', text: `${G}${G}`, length: 2 },
      { kind: 'text', text: '-4821', length: 5 },
    ]);
  });
});

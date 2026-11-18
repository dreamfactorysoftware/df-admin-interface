import {
  RULE_OPS,
  RuleOp,
  RuleTarget,
  TermOp,
  compileRule,
  describeRule,
  escapeLiteral,
  normalizeTerm,
  toMask,
} from './rule-pattern';

/** The Compliance baselines' rules (df-masking src/Baselines/Definitions). */
const BASELINE_PATTERNS = [
  '^(?:mrn|medical_?rec(?:ord)?_?(?:id|no|num|nbr|number)|med_?rec_?(?:no|num|nbr|number)|patient_?(?:no|num|nbr|number|mrn)|chart_?(?:no|num|nbr|number))$',
  '^(?:health_?plan_?(?:beneficiary_?)?(?:id|no|num|nbr|number)|beneficiary_?(?:no|num|nbr|number)|insurance_?member_?(?:id|no|num|nbr|number)|(?:medicare|medicaid)_?(?:id|no|num|nbr|number)|mbi|hicn)$',
  '^(?:fbi|state_?id|booking|arrest|inmate|offender|warrant)_?(?:no|num|nbr|number)$|^ucn$',
  '^(?:case|incident|offense|offence|citation)_?(?:no|num|nbr|number)$',
  '^(?:rap_?sheet|criminal_?charges?|offen[cs]es?|prior_?arrests?|arrest_?history)$',
  '^(?:fingerprints|finger_?print_?(?:image|template|data)|palm_?prints?|mug_?shot|dna_?profile)$',
  '^(?:(?:customer|deposit|checking|savings|loan|ach|dda)_?acc(?:oun)?t_?(?:no|num|nbr|number)|acc(?:oun)?t_?(?:no|num|nbr|number)|loan_?(?:no|num|nbr|number))$',
  '^(?:(?:account|available|current|ledger|outstanding|loan|principal|statement)_?)?balance$|^(?:credit_?(?:score|rating|limit)|fico(?:_?score)?|loan_?amount|annual_?income|net_?worth|debt_?to_?income(?:_?ratio)?)$',
  '^(?:pan|cc_?(?:no|num|nbr)|card_?(?:no|num|nbr)|cardnum|acct_?pan|primary_?acct_?(?:no|num|nbr|number))$',
  '^(?:cvv2|cvc2|cav2|card_?(?:cvv|cvc|cvv2|cvc2|cid)|track_?[12](?:_?data)?|track_?data|mag_?stripe(?:_?data)?|pin_?block)$',
  '^(?:(?:cc|card)_?exp(?:iry|iration)?(?:_?(?:date|month|year|mm|yy|yyyy|mmyy))?|exp_?(?:mm|yy|yyyy|mmyy))$',
  '^(?:card_?holder(?:_?name)?|name_?on_?card|cc_?name)$',
];

/** Terms an admin might type: metacharacters, spaces, unicode, - # | … */
const TERMS = [
  'emp_ssn',
  'SSN',
  'social sec',
  'first name',
  'a.b',
  '.',
  '..',
  '.*',
  'x*y+z?',
  '(?:x)',
  '(a)',
  '[abc]',
  ']',
  '{2,3}',
  '}',
  'a|b',
  '|',
  'pipe|',
  '^start',
  '^',
  'end$',
  '$',
  'back\\slash',
  'trail\\',
  '\\',
  '\\d+',
  'mixed-dash',
  '-',
  '#tag',
  '#',
  '50%',
  'a/b',
  'quote"\'',
  '@example.com',
  'EMP-',
  'naïve',
  'número_seguro',
  '社会保障',
  'Ünïcødé ✓',
  '😀',
  'AB123456',
  '555-0100',
  '(555) 010-0100',
  'AA######',
];

describe('rule patterns', () => {
  describe('compileRule writes the shapes in the spec table', () => {
    it.each<[RuleTarget, TermOp, string[], string]>([
      ['name', 'is', ['emp_ssn'], '^emp_ssn$'],
      ['name', 'is', ['emp_ssn', 'social_sec'], '^(?:emp_ssn|social_sec)$'],
      ['name', 'contains', ['ssn'], 'ssn'],
      ['name', 'contains', ['ssn', 'tax_id'], '(?:ssn|tax_id)'],
      ['name', 'startsWith', ['tax_'], '^tax_'],
      ['name', 'startsWith', ['tax_', 'fed_'], '^(?:tax_|fed_)'],
      ['name', 'endsWith', ['_ssn'], '_ssn$'],
      ['name', 'endsWith', ['_ssn', '_sin'], '(?:_ssn|_sin)$'],
      ['value', 'looksLike', ['AB123456'], '^\\p{L}{2}\\d{6}$'],
      [
        'value',
        'looksLike',
        ['AB123456', '555-0100'],
        '^(?:\\p{L}{2}\\d{6}|\\d{3}-\\d{4})$',
      ],
      ['value', 'contains', ['@example.com'], '@example\\.com'],
      ['value', 'startsWith', ['EMP-'], '^EMP-'],
    ])('%s %s %j -> %s', (target, op, terms, pattern) => {
      expect(compileRule(target, op, terms)).toBe(pattern);
    });

    it('regex is the text as typed (trimmed, like the server)', () => {
      expect(compileRule('name', 'regex', '  ^emp_ssn$|social_sec ')).toBe(
        '^emp_ssn$|social_sec'
      );
      expect(compileRule('value', 'regex', '^[A-Z]{2}\\d{6}$')).toBe(
        '^[A-Z]{2}\\d{6}$'
      );
    });

    it('an operator the target does not have compiles to nothing', () => {
      expect(compileRule('value', 'is', ['x'])).toBe('');
      expect(compileRule('value', 'endsWith', ['x'])).toBe('');
      expect(compileRule('name', 'looksLike', ['x'])).toBe('');
    });

    it('terms keep the case typed (the server matches case-insensitively)', () => {
      expect(compileRule('name', 'is', ['Emp_SSN'])).toBe('^Emp_SSN$');
    });
  });

  describe('escaping', () => {
    it('escapes every PCRE metacharacter outside a class, and nothing else', () => {
      expect(escapeLiteral('\\^$.[]|()?*+{}')).toBe(
        '\\\\\\^\\$\\.\\[\\]\\|\\(\\)\\?\\*\\+\\{\\}'
      );
      // The server's delimiter is \x01: / needs no escape; - and # are
      // literal outside a class.
      expect(escapeLiteral('a/b-c#d e_ü')).toBe('a/b-c#d e_ü');
    });

    it('escaped terms match only themselves', () => {
      for (const term of TERMS) {
        const re = new RegExp(compileRule('name', 'is', [term]), 'iu');
        expect(re.test(term)).toBe(true);
        expect(re.test(`${term}x`)).toBe(false);
      }
      expect(
        new RegExp(compileRule('name', 'contains', ['a.b'])).test('axb')
      ).toBe(false);
    });
  });

  describe('format masks', () => {
    it.each([
      ['AB123456', 'AA######'],
      ['555-0100', '###-####'],
      ['AA######', 'AA######'],
      ['ab-12#', 'AA-###'],
      ['(555) 010-0100', '(###) ###-####'],
      ['É9', 'A#'],
      ['emp ssn', 'AAA AAA'],
      // Every script: letters are A, numbers are #.
      ['Müller', 'AAAAAA'],
      ['Иван123', 'AAAA###'],
      ['山田太郎', 'AAAA'],
      ['٣٤٥', '###'],
      ['Ⅻ½²', '###'],
      // A letter's combining marks are part of it (NFD é is one A).
      ['Jose\u0301 7', 'AAAA #'],
      ['कि', 'A'],
      ['5\u0301-', '#-'],
    ])('%s -> %s', (text, mask) => {
      expect(toMask(text)).toBe(mask);
      expect(toMask(mask)).toBe(mask);
    });

    it('runs compile to counted classes, single ones uncounted', () => {
      expect(compileRule('value', 'looksLike', ['A#'])).toBe('^\\p{L}\\d$');
      expect(compileRule('value', 'looksLike', ['(###) ###-####'])).toBe(
        '^\\(\\d{3}\\) \\d{3}-\\d{4}$'
      );
      expect(compileRule('value', 'looksLike', ['A.A'])).toBe(
        '^\\p{L}\\.\\p{L}$'
      );
    });

    it('the raw example never reaches the pattern', () => {
      const p = compileRule('value', 'looksLike', ['QW857431']);
      expect(p).toBe('^\\p{L}{2}\\d{6}$');
      expect(p).not.toMatch(/[QW]|857|431/);
    });

    it.each(['山田太郎', 'Иван123', 'Müller', 'José', '٣٤٥', 'Ⅻ-½', 'Zoë'])(
      'the raw example never reaches the pattern, in any script: %s',
      example => {
        const p = compileRule('value', 'looksLike', [example]);
        // Only classes, counts, anchors and the example's punctuation.
        expect(p.replace(/\\p\{L\}|\\d|\{\d+\}|[\^$\\-]/g, '')).toBe('');
      }
    );

    it('compiled masks match values of that shape, in any script', () => {
      // The server compiles with /iu, where \p{L} and \d know every script.
      const re = new RegExp(
        compileRule('value', 'looksLike', ['AB123456', '555-0100']),
        'iu'
      );
      expect(re.test('zq000001')).toBe(true);
      expect(re.test('867-5309')).toBe(true);
      expect(re.test('ÄÖ000001')).toBe(true);
      expect(re.test('AB12345')).toBe(false);
      const own = (example: string) =>
        new RegExp(compileRule('value', 'looksLike', [example]), 'iu').test(
          example
        );
      expect(own('Müller')).toBe(true);
      expect(own('山田太郎')).toBe(true);
      expect(own('Иван-12')).toBe(true);
    });
  });

  describe('blank terms', () => {
    it.each(['', ' ', '   ', '\t', '\n '])('%j is rejected', blank => {
      for (const op of ['is', 'contains', 'looksLike'] as TermOp[]) {
        expect(normalizeTerm(op, blank)).toBeNull();
      }
      expect(compileRule('name', 'is', [blank])).toBe('');
      expect(compileRule('value', 'looksLike', [blank, blank])).toBe('');
      expect(compileRule('name', 'contains', [blank, 'ssn'])).toBe('ssn');
    });

    it('terms are trimmed', () => {
      expect(normalizeTerm('is', '  emp ssn ')).toBe('emp ssn');
      expect(compileRule('name', 'startsWith', [' tax_ '])).toBe('^tax_');
      expect(compileRule('name', 'regex', '   ')).toBe('');
    });
  });

  describe('describeRule reads back exactly what compileRule writes', () => {
    const termOps = (target: RuleTarget) =>
      RULE_OPS[target].filter((o): o is TermOp => o !== 'regex');
    const expected = (op: TermOp, terms: string[]) =>
      terms.map(t => normalizeTerm(op, t)!);
    const cases: [RuleTarget, TermOp][] = (['name', 'value'] as const).flatMap(
      t => termOps(t).map(op => [t, op] as [RuleTarget, TermOp])
    );

    it.each(cases)('%s %s, one term at a time', (target, op) => {
      for (const term of TERMS) {
        const pattern = compileRule(target, op, [term]);
        expect({ term, shape: describeRule(target, pattern) }).toEqual({
          term,
          shape: { op, terms: expected(op, [term]) },
        });
      }
    });

    it.each(cases)('%s %s, several terms', (target, op) => {
      const sets = [
        TERMS,
        TERMS.slice(0, 2),
        ['a|b', 'c'],
        ['|', '||'],
        ['$', '^'],
        ['trail\\', 'x'],
        ['(?:x)', 'y)'],
        ['😀', '社会保障', 'naïve'],
      ];
      for (const terms of sets) {
        const pattern = compileRule(target, op, terms);
        expect(describeRule(target, pattern)).toEqual({
          op,
          terms: expected(op, terms),
        });
      }
    });

    it('surrounding spaces are trimmed on the way in, so they round-trip trimmed', () => {
      const p = compileRule('name', 'contains', ['  ssn ', ' tax id ']);
      expect(describeRule('name', p)).toEqual({
        op: 'contains',
        terms: ['ssn', 'tax id'],
      });
    });

    it('an unwrapped alternation of plain literals reads as contains', () => {
      expect(describeRule('name', 'ssn|tax_id')).toEqual({
        op: 'contains',
        terms: ['ssn', 'tax_id'],
      });
      expect(describeRule('value', '@acme\\.com|@acme\\.org')).toEqual({
        op: 'contains',
        terms: ['@acme.com', '@acme.org'],
      });
    });

    it.each(BASELINE_PATTERNS)('baseline pattern stays a regex: %s', p => {
      expect(describeRule('name', p)).toEqual({ op: 'regex' });
      expect(describeRule('value', p)).toEqual({ op: 'regex' });
    });

    it.each<[RuleTarget, string]>([
      // Not the builder's shapes, even where the meaning is close.
      ['name', '^emp_ssn$|social_sec'],
      ['name', '(^|_)(ssn|nino|bsn)($|_)'],
      ['name', '^(?:emp_ssn)$'],
      ['name', '^a|b$'],
      ['name', '^(?:a|b)|c$'],
      ['name', '(?:a)(?:b)'],
      ['name', '(?:a|b)(?:c)'],
      ['name', 'a||b'],
      ['name', '|a'],
      ['name', 'a|'],
      ['name', 'a | b'],
      ['name', '\\d+'],
      ['name', 'e_?mail'],
      ['name', '^(?>emp|staff)_ssn$'],
      ['name', '(?i)^ssn$'],
      ['name', '^ssn$ '],
      ['name', ' ^ssn$'],
      ['name', '^'],
      ['name', '$'],
      ['name', '^$'],
      ['name', ''],
      ['name', '\\'],
      ['name', 'a\\'],
      ['name', '^\\p{L}{2}\\d{6}$'],
      // The ASCII classes of an earlier draft are a regex now.
      ['value', '^[A-Z]{2}[0-9]{6}$'],
      ['value', '^[A-Z]{2}\\d{6}$'],
      ['value', '^X\\d+$'],
      ['value', '^abc$'],
      ['value', '^AB\\d$'],
      ['value', '^\\p{L}x$'],
      ['value', '^\\p{L}{1}$'],
      ['value', '^\\p{L}\\p{L}$'],
      ['value', '^\\p{L}{02}$'],
      ['value', '^\\p{L}{0}$'],
      ['value', '^\\p{Lu}{2}$'],
      ['value', '^\\p{L}{9999}$'],
      ['value', '^(?:\\p{L}{2})$'],
      ['value', '^\\d\\d$'],
      ['value', '^\\D{2}$'],
      ['value', 'ssn$'],
      ['value', '^ $'],
    ])('%s %j is a regex', (target, p) => {
      expect(describeRule(target, p)).toEqual({ op: 'regex' });
    });

    it('a literal-only mask is still a mask', () => {
      expect(describeRule('value', '^--$')).toEqual({
        op: 'looksLike',
        terms: ['--'],
      });
    });

    it('anchors are read by target: values have no "is" or "ends with"', () => {
      expect(describeRule('name', '^\\-\\-$')).toEqual({ op: 'regex' });
      expect(describeRule('name', '^--$')).toEqual({
        op: 'is',
        terms: ['--'],
      });
      expect(describeRule('value', '_ssn$')).toEqual({ op: 'regex' });
      expect(describeRule('name', '_ssn$')).toEqual({
        op: 'endsWith',
        terms: ['_ssn'],
      });
    });

    it('every operator a target lists compiles (and regex round-trips as text)', () => {
      for (const target of ['name', 'value'] as RuleTarget[]) {
        for (const op of RULE_OPS[target] as RuleOp[]) {
          const p =
            op === 'regex'
              ? compileRule(target, op, '^x+$')
              : compileRule(target, op, ['x']);
          expect(p).not.toBe('');
          if (op === 'regex') expect(describeRule(target, p).op).toBe('regex');
        }
      }
    });
  });
});

import {
  decodeJwt,
  hostOf,
  isProtocolHeader,
  jwtsIn,
  originOf,
  pathOf,
  prettyBody,
  splitScopes,
  statusVariant,
  tokenizeJson,
  SCOPE_RE,
} from './jwt-view';
import { jwt } from './aauth-testing';

describe('jwt-view', () => {
  it('decodes a compact JWT header and payload without verifying', () => {
    const raw = jwt(
      { alg: 'EdDSA', typ: 'aa-agent+jwt', kid: 'k1' },
      { iss: 'https://ap.example', sub: 'aauth:bot', exp: 2_000_000_000 }
    );
    const d = decodeJwt(raw);
    expect(d.typ).toBe('aa-agent+jwt');
    expect(d.header?.['kid']).toBe('k1');
    expect(d.payload?.['sub']).toBe('aauth:bot');
    expect(d.expMs).toBe(2_000_000_000_000);
    expect(d.raw).toBe(raw);
  });

  it('decodes UTF-8 claims (base64url, no padding)', () => {
    const d = decodeJwt(jwt({ typ: 'x' }, { name: 'Zoë Ł' }));
    expect(d.payload?.['name']).toBe('Zoë Ł');
  });

  it('returns nulls for something that is not a JWT', () => {
    expect(decodeJwt('nope')).toEqual(
      expect.objectContaining({ header: null, payload: null, typ: null })
    );
    expect(decodeJwt('a.b.c').payload).toBeNull();
  });

  it('tokenizes JSON into keys, strings, numbers, literals and punctuation', () => {
    const text = JSON.stringify(
      { a: 'x', n: -1.5e3, t: true, z: null },
      null,
      2
    );
    const tokens = tokenizeJson(text);
    expect(tokens.map(t => t.text).join('')).toBe(text);
    const kinds = (k: string) =>
      tokens.filter(t => t.kind === k).map(t => t.text);
    expect(kinds('key')).toEqual(['"a"', '"n"', '"t"', '"z"']);
    expect(kinds('string')).toEqual(['"x"']);
    expect(kinds('number')).toEqual(['-1500']);
    expect(kinds('literal')).toEqual(['true', 'null']);
  });

  it('keeps escaped quotes inside one string token', () => {
    const tokens = tokenizeJson('{"k": "say \\"hi\\""}');
    expect(tokens.find(t => t.kind === 'string')?.text).toBe('"say \\"hi\\""');
  });

  it('pretty-prints JSON bodies and passes other text through', () => {
    expect(prettyBody('{"a":1}')).toEqual({
      json: true,
      text: '{\n  "a": 1\n}',
    });
    expect(prettyBody('plain')).toEqual({ json: false, text: 'plain' });
    expect(prettyBody('{broken')).toEqual({ json: false, text: '{broken' });
    expect(prettyBody(null)).toEqual({ json: false, text: '' });
  });

  it('formats URLs, scopes and statuses', () => {
    expect(hostOf('https://agent.example:8443/x')).toBe('agent.example:8443');
    expect(pathOf('https://df.example/api/v2/a?limit=5')).toBe(
      '/api/v2/a?limit=5'
    );
    expect(originOf('https://df.example/')).toBe('https://df.example');
    expect(splitScopes('sales.read  sales.refund')).toEqual([
      'sales.read',
      'sales.refund',
    ]);
    expect(splitScopes(null)).toEqual([]);
    expect(statusVariant(200)).toBe('success');
    expect(statusVariant(202)).toBe('accent');
    expect(statusVariant(401)).toBe('warning');
    expect(statusVariant(403)).toBe('danger');
    expect(isProtocolHeader('Signature-Input')).toBe(true);
    expect(isProtocolHeader('AAuth-Requirement')).toBe(true);
    expect(isProtocolHeader('Content-Type')).toBe(false);
  });

  it('finds the JWTs carried inside header values', () => {
    const agent = jwt({ typ: 'aa-agent+jwt' }, { sub: 'aauth:bot' });
    const resource = jwt({ typ: 'aa-resource+jwt' }, { scope: 'sales.read' });
    expect(jwtsIn(`sig=jwt;jwt="${agent}"`).map(t => t.typ)).toEqual([
      'aa-agent+jwt',
    ]);
    expect(
      jwtsIn(`requirement=auth-token; resource-token="${resource}"`)[0]
        .payload?.['scope']
    ).toBe('sales.read');
    expect(jwtsIn('sig=jwt;jwt="eyJ..."')).toEqual([]);
    expect(jwtsIn('eyJub3Q.anNvbg.x')).toEqual([]);
    expect(jwtsIn('application/json')).toEqual([]);
    expect(jwtsIn(null)).toEqual([]);
  });

  it('validates scope names like the server', () => {
    expect(SCOPE_RE.test('sales.read')).toBe(true);
    expect(SCOPE_RE.test('a:b_c-d')).toBe(true);
    expect(SCOPE_RE.test('Sales')).toBe(false);
    expect(SCOPE_RE.test('.x')).toBe(false);
    expect(SCOPE_RE.test('a'.repeat(65))).toBe(false);
  });
});

import { MASK, maskSecret, maskSecretsIn, isSecretFieldName } from './mask';

const KEY = '6498a8ad1beb4f0e9c3d2a1b8f7e6d5c4b3a29180716253443526170819a0b1c';
const JWT =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmMzc3NjgyMzNlMGQifQ.s1gn4tur3_v4lu3';

describe('maskSecret', () => {
  it('returns a fixed-width mask that does not leak the real length', () => {
    expect(maskSecret(KEY)).toBe(MASK);
    expect(maskSecret('short')).toBe(MASK);
    expect(maskSecret(KEY).length).toBe(maskSecret('short').length);
  });

  it('leaves an absent value empty rather than masking nothing', () => {
    expect(maskSecret('')).toBe('');
    expect(maskSecret(null)).toBe('');
    expect(maskSecret(undefined)).toBe('');
  });
});

describe('maskSecretsIn', () => {
  const curl = `curl -X GET 'http://localhost/api/v2/db/_table/contact' \\\n  -H 'X-DreamFactory-API-Key: ${KEY}' \\\n  -H 'X-DreamFactory-Session-Token: ${JWT}'`;

  it('covers the key and the session token but keeps the command readable', () => {
    const out = maskSecretsIn(curl, [KEY, JWT]);
    expect(out).not.toContain(KEY);
    expect(out).not.toContain(JWT);
    expect(out).toContain('curl -X GET');
    expect(out).toContain('X-DreamFactory-API-Key');
    expect(out).toContain('/api/v2/db/_table/contact');
  });

  it('catches an API key it was not told about', () => {
    expect(maskSecretsIn(`-H 'X-Key: ${KEY}'`)).not.toContain(KEY);
  });

  it('catches a JWT it was not told about', () => {
    expect(maskSecretsIn(`Bearer ${JWT}`)).not.toContain(JWT);
  });

  it('masks every occurrence, not just the first', () => {
    const out = maskSecretsIn(`${KEY} and again ${KEY}`, [KEY]);
    expect(out).not.toContain(KEY);
    expect(out.split(MASK).length - 1).toBe(2);
  });

  it('leaves text with no secrets untouched', () => {
    const plain = "curl -X GET 'http://localhost/api/v2/db/_table/contact'";
    expect(maskSecretsIn(plain)).toBe(plain);
  });

  it('ignores short known values so a stray word is not blanked out', () => {
    // 'db' would otherwise replace every occurrence of those two letters.
    expect(maskSecretsIn('db table in db', ['db'])).toBe('db table in db');
  });
});

describe('isSecretFieldName', () => {
  it.each([
    'client_secret',
    'oauth_client_secret',
    'api_key',
    'password',
    'auth_token',
    'AWS_SECRET_ACCESS_KEY',
  ])('treats %s as a secret', name => {
    expect(isSecretFieldName(name)).toBe(true);
  });

  it.each(['client_id', 'id', 'host', 'port', 'database', 'username'])(
    'leaves %s visible',
    name => {
      expect(isSecretFieldName(name)).toBe(false);
    }
  );

  it('handles an absent name', () => {
    expect(isSecretFieldName(null)).toBe(false);
    expect(isSecretFieldName(undefined)).toBe(false);
    expect(isSecretFieldName('')).toBe(false);
  });
});

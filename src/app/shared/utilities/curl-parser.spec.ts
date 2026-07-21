import { CurlParseError, parseCurl, tokenizeCurl } from './curl-parser';

describe('tokenizeCurl', () => {
  it('splits on whitespace', () => {
    expect(tokenizeCurl('curl -X GET http://a.b')).toEqual([
      'curl',
      '-X',
      'GET',
      'http://a.b',
    ]);
  });

  it('keeps single-quoted content literal', () => {
    expect(tokenizeCurl(`curl -H 'A: b c'`)).toEqual(['curl', '-H', 'A: b c']);
  });

  it('honours escapes inside double quotes', () => {
    expect(tokenizeCurl(`curl -d "{\\"a\\":1}"`)).toEqual([
      'curl',
      '-d',
      '{"a":1}',
    ]);
  });

  it('joins backslash line continuations', () => {
    expect(tokenizeCurl('curl \\\n  -X POST \\\n  http://a.b')).toEqual([
      'curl',
      '-X',
      'POST',
      'http://a.b',
    ]);
  });

  it('throws on an unterminated quote', () => {
    expect(() => tokenizeCurl(`curl -H 'oops`)).toThrow(CurlParseError);
  });
});

describe('parseCurl', () => {
  it('rejects input that is not a curl command', () => {
    expect(() => parseCurl('wget http://a.b')).toThrow(CurlParseError);
    expect(() => parseCurl('  ')).toThrow(CurlParseError);
  });

  it('rejects a command with no URL', () => {
    expect(() => parseCurl('curl -X GET')).toThrow(CurlParseError);
  });

  it('splits the query string off the base URL', () => {
    const result = parseCurl(
      `curl 'https://api.example.com/v1/users?limit=10&sort=name'`
    );
    expect(result.baseUrl).toBe('https://api.example.com/v1/users');
    expect(result.parameters).toEqual([
      { name: 'limit', value: '10' },
      { name: 'sort', value: 'name' },
    ]);
    expect(result.method).toBe('GET');
  });

  it('url-decodes parameter names and values', () => {
    const result = parseCurl(`curl 'https://a.b/c?q=hello%20world&a%2Bb=1'`);
    expect(result.parameters).toEqual([
      { name: 'q', value: 'hello world' },
      { name: 'a+b', value: '1' },
    ]);
  });

  it('keeps malformed percent-encoding literal', () => {
    const result = parseCurl(`curl 'https://a.b/c?q=100%'`);
    expect(result.parameters).toEqual([{ name: 'q', value: '100%' }]);
  });

  it('parses headers, including empty and colon-bearing values', () => {
    const result = parseCurl(
      `curl https://a.b -H 'Authorization: Bearer x.y.z' -H 'X-Empty;' -H 'Referer: https://c.d/e'`
    );
    expect(result.headers).toEqual([
      { name: 'Authorization', value: 'Bearer x.y.z' },
      { name: 'X-Empty', value: '' },
      { name: 'Referer', value: 'https://c.d/e' },
    ]);
  });

  it('defaults to POST when a body is present', () => {
    const result = parseCurl(`curl https://a.b -d '{"x":1}'`);
    expect(result.method).toBe('POST');
    expect(result.body).toBe('{"x":1}');
    expect(result.warnings.some(w => w.includes('body'))).toBe(true);
  });

  it('lets -X override the inferred method', () => {
    expect(parseCurl(`curl https://a.b -X PATCH -d 'a=1'`).method).toBe(
      'PATCH'
    );
  });

  it('moves the body into query parameters for -G', () => {
    const result = parseCurl(`curl -G https://a.b/c -d 'q=term&page=2'`);
    expect(result.method).toBe('GET');
    expect(result.body).toBeUndefined();
    expect(result.parameters).toEqual([
      { name: 'q', value: 'term' },
      { name: 'page', value: '2' },
    ]);
  });

  it('maps supported flags onto CURL option constants', () => {
    const result = parseCurl(
      `curl https://a.b -k -L -x http://proxy:3128 -U pu:pp --connect-timeout 5 -m 30`
    );
    expect(result.options).toEqual({
      CURLOPT_SSL_VERIFYPEER: '0',
      CURLOPT_SSL_VERIFYHOST: '0',
      CURLOPT_FOLLOWLOCATION: '1',
      CURLOPT_PROXY: 'http://proxy:3128',
      CURLOPT_PROXYUSERPWD: 'pu:pp',
      CURLOPT_CONNECTTIMEOUT: '5',
      CURLOPT_TIMEOUT: '30',
    });
  });

  it('turns -u into an Authorization Basic header', () => {
    const result = parseCurl(`curl https://a.b -u alice:secret`);
    expect(result.headers).toEqual([
      { name: 'Authorization', value: 'Basic YWxpY2U6c2VjcmV0' },
    ]);
    expect(result.options['CURLOPT_USERPWD']).toBeUndefined();
    expect(result.warnings.some(w => w.includes('-u'))).toBe(true);
  });

  it('utf-8 encodes non-ascii credentials before base64', () => {
    // "Basic " + base64(utf8("björn:pw"))
    const result = parseCurl(`curl https://a.b -u 'bjärn:pw'`);
    expect(result.headers[0].value).toBe('Basic YmrDpHJuOnB3');
  });

  it('handles -u with no password', () => {
    const result = parseCurl(`curl https://a.b -u alice`);
    expect(result.headers).toEqual([
      { name: 'Authorization', value: 'Basic YWxpY2U=' },
    ]);
  });

  it('lets an explicit Authorization header win over -u', () => {
    const result = parseCurl(
      `curl https://a.b -H 'Authorization: Bearer tok' -u alice:secret`
    );
    expect(result.headers).toEqual([
      { name: 'Authorization', value: 'Bearer tok' },
    ]);
    expect(result.warnings.some(w => w.includes('ignored'))).toBe(true);
  });

  it('turns shorthand flags into headers', () => {
    const result = parseCurl(
      `curl https://a.b -A 'my-agent/1.0' -b 'session=abc' -e 'https://ref'`
    );
    expect(result.headers).toEqual([
      { name: 'User-Agent', value: 'my-agent/1.0' },
      { name: 'Cookie', value: 'session=abc' },
      { name: 'Referer', value: 'https://ref' },
    ]);
  });

  it('accepts --flag=value and attached short-flag values', () => {
    const result = parseCurl(`curl --request=PUT -H'X-A: 1' --url=https://a.b`);
    expect(result.method).toBe('PUT');
    expect(result.baseUrl).toBe('https://a.b');
    expect(result.headers).toEqual([{ name: 'X-A', value: '1' }]);
  });

  it('ignores noise flags without treating them as the URL', () => {
    const result = parseCurl(`curl -s -v --compressed https://a.b -o out.txt`);
    expect(result.baseUrl).toBe('https://a.b');
    expect(result.options['CURLOPT_ENCODING']).toBe('');
  });

  it('warns about multipart form fields', () => {
    const result = parseCurl(`curl https://a.b -F 'file=@x.png'`);
    expect(result.method).toBe('POST');
    expect(result.warnings.some(w => w.includes('Multipart'))).toBe(true);
  });

  it('warns when more than one URL is given', () => {
    const result = parseCurl(`curl https://a.b https://c.d`);
    expect(result.baseUrl).toBe('https://a.b');
    expect(result.warnings.some(w => w.includes('2 URLs'))).toBe(true);
  });

  it('parses a realistic multi-line command', () => {
    const result = parseCurl(`curl -X POST \\
      'https://api.example.com/v2/orders?dry_run=true' \\
      -H 'Content-Type: application/json' \\
      -H 'X-API-Key: abc123' \\
      -d '{"sku":"A-1","qty":2}'`);

    expect(result.baseUrl).toBe('https://api.example.com/v2/orders');
    expect(result.method).toBe('POST');
    expect(result.parameters).toEqual([{ name: 'dry_run', value: 'true' }]);
    expect(result.headers).toEqual([
      { name: 'Content-Type', value: 'application/json' },
      { name: 'X-API-Key', value: 'abc123' },
    ]);
    expect(result.body).toBe('{"sku":"A-1","qty":2}');
  });
});

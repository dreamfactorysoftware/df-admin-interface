import { isValidHttpUrl } from './url';

describe('isValidHttpUrl', () => {
  it('should return true for valid http URLs', () => {
    const validHttpUrl = 'http://example.com';
    expect(isValidHttpUrl(validHttpUrl)).toBe(true);
  });

  it('should return true for valid https URLs', () => {
    const validHttpsUrl = 'https://example.com';
    expect(isValidHttpUrl(validHttpsUrl)).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    const invalidUrl = 'example';
    expect(isValidHttpUrl(invalidUrl)).toBe(false);
  });

  it('should return false for URLs with non-http/https protocols', () => {
    const ftpUrl = 'ftp://example.com';
    expect(isValidHttpUrl(ftpUrl)).toBe(false);
  });

  it('should return false for URLs without protocols', () => {
    const noProtocolUrl = '//example.com';
    expect(isValidHttpUrl(noProtocolUrl)).toBe(false);
  });
});

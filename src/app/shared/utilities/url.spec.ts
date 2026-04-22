import {
  isValidHttpUrl,
  isSameOriginUrl,
  handleRedirectIfPresent,
  REDIRECT_URL_KEY,
} from './url';

// ---------------------------------------------------------------------------
// isValidHttpUrl (pre-existing coverage, kept here for completeness)
// ---------------------------------------------------------------------------

describe('isValidHttpUrl', () => {
  it('should return true for valid http URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true);
  });

  it('should return true for valid https URLs', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidHttpUrl('example')).toBe(false);
  });

  it('should return false for URLs with non-http/https protocols', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
  });

  it('should return false for URLs without protocols', () => {
    expect(isValidHttpUrl('//example.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSameOriginUrl — the new origin-validation helper
// ---------------------------------------------------------------------------

describe('isSameOriginUrl', () => {
  // jsdom sets window.location.origin to 'http://localhost' by default.
  const SAME_ORIGIN = 'http://localhost';

  it('accepts a same-origin URL', () => {
    expect(isSameOriginUrl(`${SAME_ORIGIN}/some/path`)).toBe(true);
  });

  it('accepts a same-origin URL that already carries query params', () => {
    expect(isSameOriginUrl(`${SAME_ORIGIN}/app?tab=home`)).toBe(true);
  });

  it('rejects an external https URL (open-redirect target)', () => {
    expect(isSameOriginUrl('https://evil.com/steal')).toBe(false);
  });

  it('rejects an external http URL', () => {
    expect(isSameOriginUrl('http://attacker.example/phish')).toBe(false);
  });

  it('rejects a protocol-relative URL (//evil.com)', () => {
    expect(isSameOriginUrl('//evil.com')).toBe(false);
  });

  it('rejects a javascript: URL', () => {
    expect(isSameOriginUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects a data: URL', () => {
    expect(isSameOriginUrl('data:text/html,<h1>xss</h1>')).toBe(false);
  });

  it('rejects a bare path string (no origin to compare)', () => {
    expect(isSameOriginUrl('/dashboard')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isSameOriginUrl('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// handleRedirectIfPresent — the patched redirect function
// ---------------------------------------------------------------------------

describe('handleRedirectIfPresent', () => {
  const SAME_ORIGIN = 'http://localhost';

  /**
   * Replace window.location with a mock that records href assignments.
   * Returns a restore function and a getter for the recorded value.
   *
   * TypeScript's strict typing prevents spreading window.location into an
   * object literal that also has a setter for `href`, so we cast through
   * `unknown` where needed.
   */
  function installLocationMock(): {
    getNavigatedTo: () => string | undefined;
    restore: () => void;
  } {
    let navigatedTo: string | undefined;

    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'location'
    );

    const mock: unknown = {
      ancestorOrigins: window.location.ancestorOrigins,
      assign: window.location.assign.bind(window.location),
      hash: window.location.hash,
      host: window.location.host,
      hostname: window.location.hostname,
      origin: SAME_ORIGIN,
      pathname: window.location.pathname,
      port: window.location.port,
      protocol: window.location.protocol,
      reload: window.location.reload.bind(window.location),
      replace: window.location.replace.bind(window.location),
      search: window.location.search,
      toString: window.location.toString.bind(window.location),
      get href(): string {
        return SAME_ORIGIN + '/';
      },
      set href(v: string) {
        navigatedTo = v;
      },
    };

    Object.defineProperty(window, 'location', {
      configurable: true,
      get: () => mock as Location,
    });

    return {
      getNavigatedTo: () => navigatedTo,
      restore() {
        if (originalDescriptor) {
          Object.defineProperty(window, 'location', originalDescriptor);
        }
      },
    };
  }

  afterEach(() => {
    sessionStorage.clear();
  });

  it('returns false and does not navigate when sessionStorage is empty', () => {
    const loc = installLocationMock();
    try {
      const result = handleRedirectIfPresent('tok123');
      expect(result).toBe(false);
      expect(loc.getNavigatedTo()).toBeUndefined();
    } finally {
      loc.restore();
    }
  });

  it('redirects to a valid same-origin URL and appends session token', () => {
    const target = `${SAME_ORIGIN}/dashboard`;
    sessionStorage.setItem(REDIRECT_URL_KEY, target);

    const loc = installLocationMock();
    try {
      const result = handleRedirectIfPresent('tok123');
      expect(result).toBe(true);
      expect(loc.getNavigatedTo()).toBe(`${target}?session_token=tok123`);
      expect(sessionStorage.getItem(REDIRECT_URL_KEY)).toBeNull();
    } finally {
      loc.restore();
    }
  });

  it('appends session token with & when URL already has query params', () => {
    const target = `${SAME_ORIGIN}/app?tab=users`;
    sessionStorage.setItem(REDIRECT_URL_KEY, target);

    const loc = installLocationMock();
    try {
      handleRedirectIfPresent('tok456');
      expect(loc.getNavigatedTo()).toBe(`${target}&session_token=tok456`);
    } finally {
      loc.restore();
    }
  });

  it('redirects without token when sessionToken is null', () => {
    const target = `${SAME_ORIGIN}/dashboard`;
    sessionStorage.setItem(REDIRECT_URL_KEY, target);

    const loc = installLocationMock();
    try {
      const result = handleRedirectIfPresent(null);
      expect(result).toBe(true);
      expect(loc.getNavigatedTo()).toBe(target);
    } finally {
      loc.restore();
    }
  });

  it('rejects an external URL and falls back to root', () => {
    sessionStorage.setItem(REDIRECT_URL_KEY, 'https://evil.com/steal');

    const loc = installLocationMock();
    try {
      const result = handleRedirectIfPresent('tok789');
      expect(result).toBe(true);
      expect(loc.getNavigatedTo()).toBe('/');
      expect(sessionStorage.getItem(REDIRECT_URL_KEY)).toBeNull();
    } finally {
      loc.restore();
    }
  });

  it('rejects a protocol-relative URL (//evil.com) and falls back to root', () => {
    sessionStorage.setItem(REDIRECT_URL_KEY, '//evil.com');

    const loc = installLocationMock();
    try {
      const result = handleRedirectIfPresent('tok789');
      expect(result).toBe(true);
      expect(loc.getNavigatedTo()).toBe('/');
    } finally {
      loc.restore();
    }
  });

  it('rejects a javascript: URL and falls back to root', () => {
    sessionStorage.setItem(
      REDIRECT_URL_KEY,
      'javascript:alert(document.cookie)'
    );

    const loc = installLocationMock();
    try {
      const result = handleRedirectIfPresent('tok789');
      expect(result).toBe(true);
      expect(loc.getNavigatedTo()).toBe('/');
    } finally {
      loc.restore();
    }
  });

  it('clears the sessionStorage key even when validation fails', () => {
    sessionStorage.setItem(REDIRECT_URL_KEY, 'https://evil.com/steal');

    const loc = installLocationMock();
    try {
      handleRedirectIfPresent('tok');
      expect(sessionStorage.getItem(REDIRECT_URL_KEY)).toBeNull();
    } finally {
      loc.restore();
    }
  });
});

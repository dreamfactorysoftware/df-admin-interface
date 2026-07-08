import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import {
  applyServerErrorsToForm,
  emptyListWithError,
  formatForSupport,
  isAppError,
  normalizeError,
} from './app-error';

function httpError(
  status: number,
  body: unknown,
  url = '/api/v2/system/admin'
) {
  return new HttpErrorResponse({ status, error: body, url });
}

describe('normalizeError', () => {
  it('is idempotent on AppError input', () => {
    const first = normalizeError(new Error('boom'));
    expect(normalizeError(first)).toBe(first);
  });

  it('maps plain errors and strings to client kind', () => {
    expect(normalizeError(new TypeError('bad read'))).toMatchObject({
      kind: 'client',
      status: 0,
      message: 'bad read',
    });
    expect(normalizeError('plain failure').message).toBe('plain failure');
    expect(normalizeError(undefined).message).toBe('errors.unknown');
  });

  it('maps status 0 / ProgressEvent to network kind', () => {
    const err = new HttpErrorResponse({
      status: 0,
      error: new ProgressEvent('error'),
    });
    expect(normalizeError(err)).toMatchObject({
      kind: 'network',
      status: 0,
      message: 'errors.network',
    });
  });

  it('reads the canonical DF envelope in snake_case', () => {
    const err = httpError(404, {
      error: { code: 404, message: 'Record not found.', status_code: 404 },
    });
    const e = normalizeError(err, { url: '/api/v2/x', method: 'GET' });
    expect(e).toMatchObject({
      kind: 'not-found',
      status: 404,
      message: 'Record not found.',
      code: '404',
      url: '/api/v2/x',
      method: 'GET',
    });
  });

  it('collects all context.resource messages, not just [0]', () => {
    const err = httpError(422, {
      error: {
        code: 422,
        message: 'Batch Error: Not all requested records could be created.',
        context: {
          error: [0, 1],
          resource: [
            { code: 400, message: 'Required field email can not be empty.' },
            { code: 400, message: 'Name must be unique.' },
          ],
        },
      },
    });
    const e = normalizeError(err);
    expect(e.kind).toBe('validation');
    expect(e.fields.map(f => f.message)).toEqual([
      'Required field email can not be empty.',
      'Name must be unique.',
    ]);
  });

  it('survives context: null (DF 500s)', () => {
    const err = httpError(500, {
      error: { code: 500, message: 'Server fell over.', context: null },
    });
    const e = normalizeError(err);
    expect(e.kind).toBe('server');
    expect(e.fields).toEqual([]);
  });

  it('never displays string/HTML bodies as the headline', () => {
    const e = normalizeError(httpError(502, '<html>502 Bad Gateway</html>'));
    expect(e.message).toBe('errors.http5xx');
    expect(e.raw).toContain('502');
  });

  it('never displays Angular JSON-parse wrappers', () => {
    const e = normalizeError(
      httpError(500, {
        error: new SyntaxError('Unexpected token < in JSON'),
        text: '<html>fatal</html>',
      })
    );
    expect(e.message).toBe('errors.http5xx');
  });

  it('falls back by status class on empty bodies', () => {
    expect(normalizeError(httpError(403, null)).message).toBe('errors.http4xx');
    expect(normalizeError(httpError(403, null)).kind).toBe('forbidden');
  });

  it('reads the flat body variant', () => {
    const e = normalizeError(httpError(402, { message: 'Payment required' }));
    expect(e.message).toBe('Payment required');
  });

  it('replaces database driver internals with friendly keys', () => {
    const dup = httpError(500, {
      error: {
        code: 500,
        message:
          "SQLSTATE[23000]: Duplicate entry 'a@b.com' for key 'user_email_unique'",
      },
    });
    expect(normalizeError(dup).message).toBe('alerts.duplicateEmail');
    const constraint = httpError(500, {
      error: { code: 500, message: 'SQLSTATE[23000]: constraint violation' },
    });
    expect(normalizeError(constraint).message).toBe(
      'errors.databaseConstraint'
    );
  });

  it('keeps the legacy err.error.* bridge working for unswept readers', () => {
    const body = {
      error: {
        code: 422,
        message: 'nope',
        context: { resource: [{ code: 400, message: 'bad field' }] },
      },
    };
    const e = normalizeError(httpError(422, body)) as any;
    expect(e.error.error.message).toBe('nope');
    expect(e.error.error.context.resource[0].message).toBe('bad field');
  });
});

describe('isAppError', () => {
  it('accepts normalized errors and rejects lookalikes', () => {
    expect(isAppError(normalizeError('x'))).toBe(true);
    expect(isAppError({ message: 'x' })).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe('formatForSupport', () => {
  it('bundles status, request, message, fields and truncated raw body', () => {
    const e = normalizeError(
      httpError(422, {
        error: {
          code: 422,
          message: 'Invalid.',
          context: { resource: [{ code: 400, message: 'name is required' }] },
        },
      }),
      { url: '/api/v2/system/role', method: 'POST' }
    );
    const text = formatForSupport(e);
    expect(text).toContain('Status: 422');
    expect(text).toContain('POST /api/v2/system/role');
    expect(text).toContain('name is required');
  });

  it('truncates giant raw bodies at 4KB', () => {
    const e = normalizeError(httpError(500, 'x'.repeat(10000)));
    expect(formatForSupport(e)).toContain('[truncated]');
    expect(formatForSupport(e).length).toBeLessThan(6000);
  });
});

describe('applyServerErrorsToForm', () => {
  it('maps messages naming a control and returns the rest', () => {
    const form = new FormGroup({
      email: new FormControl(''),
      firstName: new FormControl(''),
    });
    const e = normalizeError(
      httpError(422, {
        error: {
          code: 422,
          message: 'Invalid.',
          context: {
            resource: [
              { code: 400, message: 'Required field email can not be empty.' },
              { code: 400, message: 'first_name is too long.' },
              { code: 400, message: 'Something unmappable happened.' },
            ],
          },
        },
      })
    );
    const leftovers = applyServerErrorsToForm(form, e);
    expect(form.get('email')?.getError('server')).toBe(
      'Required field email can not be empty.'
    );
    expect(form.get('firstName')?.getError('server')).toBe(
      'first_name is too long.'
    );
    expect(leftovers).toEqual(['Something unmappable happened.']);
  });
});

describe('emptyListWithError', () => {
  it('produces the resolver fallback shape', () => {
    const out = emptyListWithError(httpError(500, null));
    expect(out.resource).toEqual([]);
    expect(out.meta.count).toBe(0);
    expect(isAppError(out.__error)).toBe(true);
  });
});

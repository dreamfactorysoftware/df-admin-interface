import { activityReason } from './activity-reason';

describe('activityReason', () => {
  it('splits "code: message" into the sentence and its code', () => {
    expect(
      activityReason({
        outcome: 'error',
        detail: 'invalid_signature: HTTP message signature is invalid',
      })
    ).toEqual({
      code: 'invalid_signature',
      text: 'HTTP message signature is invalid',
      key: false,
    });
    expect(
      activityReason({
        outcome: 'error',
        detail: 'clock_skew: signature created more than 60s in the future',
      })?.text
    ).toBe('Signature created more than 60s in the future');
  });

  it('turns terse internal notes into i18n keys', () => {
    expect(
      activityReason({ outcome: 'auth_required', detail: 'step-up' })
    ).toEqual({ code: null, text: 'activity.reason.stepUp', key: true });
    expect(
      activityReason({ outcome: 'denied', detail: 'untrusted person server' })
        ?.text
    ).toBe('activity.reason.untrustedPs');
  });

  it('shows anything else as it is', () => {
    expect(
      activityReason({
        outcome: 'denied',
        detail: 'No scope allows DELETE sales/_table',
      })
    ).toEqual({
      code: null,
      text: 'No scope allows DELETE sales/_table',
      key: false,
    });
  });

  it('has nothing to say for allowed or blank rows', () => {
    expect(activityReason({ outcome: 'allowed', detail: 'x: y' })).toBeNull();
    expect(activityReason({ outcome: 'blocked', detail: null })).toBeNull();
    expect(activityReason({ outcome: 'error', detail: '  ' })).toBeNull();
  });
});

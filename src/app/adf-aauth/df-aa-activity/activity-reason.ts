import { ActivityRow } from '../aauth.types';

/** Why a request was not simply allowed, split for reading. */
export interface ActivityReason {
  /** The AAuth error code the agent received (e.g. invalid_signature), when the log has one. */
  code: string | null;
  /** The sentence to show: server text, or an `aauth.` i18n key when `key` is set. */
  text: string;
  /** True when `text` is an i18n key (a short internal note made readable). */
  key: boolean;
}

/** Terse internal notes the resource logs, mapped to sentences (aauth.activity.reason.*). */
const NOTES: Record<string, string> = {
  'step-up': 'activity.reason.stepUp',
  'untrusted person server': 'activity.reason.untrustedPs',
  'person inactive or deleted': 'activity.reason.personInactive',
  'person no longer holds the role': 'activity.reason.roleRevoked',
  'role unavailable': 'activity.reason.roleUnavailable',
};

const CODED = /^([a-z][a-z0-9_]*):\s*(.+)$/s;

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Reads the activity `detail` column: "code: message" becomes the message
 * plus its code; known terse notes become plain sentences; anything else
 * is shown as it is. Allowed requests carry no reason.
 */
export function activityReason(
  row: Pick<ActivityRow, 'detail' | 'outcome'>
): ActivityReason | null {
  const detail = (row.detail ?? '').trim();
  if (!detail || row.outcome === 'allowed') return null;
  const note = NOTES[detail.toLowerCase()];
  if (note) return { code: null, text: note, key: true };
  const m = detail.match(CODED);
  if (m) return { code: m[1], text: sentence(m[2].trim()), key: false };
  return { code: null, text: sentence(detail), key: false };
}

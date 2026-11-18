/**
 * What df-masking (commercial Data Masking) said about a data response, read
 * from its response headers. Both are absent unless the package is installed,
 * mode is On, and masking touched this response, so OSS, Preview and
 * unmasked use never produce a notice. DreamFactory reads neither from
 * requests.
 *
 * - `X-DreamFactory-Masked-Fields: email, orders.card_number` - masked fields
 *   present in this response (`relation.field` for related ones, `*` when
 *   the server can't name them).
 * - `X-DreamFactory-Masking-Rewrites: filter:email, order:last%20name, +2 more`
 *   - request parts that met a masked column. `filter:<col>` means
 *   conditions on that column matched no rows: the server treats a
 *   comparison it may not evaluate as unknown (SQL NULL), so a filter never
 *   widens. `filter:*` = a filter it could not check matched no rows.
 *   `order:`/`group:` were left out.
 *
 * Both: items joined with ", " (split on "," and trim), names
 * percent-encoded per RFC 3986, capped with `+N more`.
 */
import { HttpHeaders } from '@angular/common/http';

export const MASKED_FIELDS_HEADER = 'X-DreamFactory-Masked-Fields';
export const MASKING_REWRITES_HEADER = 'X-DreamFactory-Masking-Rewrites';

export type DroppedKind = 'filter' | 'order' | 'group' | 'fields';

export interface DroppedGroup {
  kind: DroppedKind;
  /** Column names, decoded, in header order. */
  columns: string[];
  /** A filter that could not be checked safely matched no rows (`*`). */
  all: boolean;
}

export interface MaskingNotice {
  /** Values in this response are masked. */
  masked: boolean;
  /** Masked field names, decoded, in header order (no `*` or `+N more`). */
  fields: string[];
  /** Rewritten request parts, one group per kind, in header order. */
  dropped: DroppedGroup[];
  /** Further rewritten parts the header left out (`+N more`). */
  more: number;
}

const KINDS: Record<string, DroppedKind> = {
  filter: 'filter',
  having: 'filter',
  order: 'order',
  group: 'group',
  fields: 'fields',
};

const MORE = /^\+(\d+)\s*more$/i;

function decode(name: string): string {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

/** The notice for a response, or null when it carries no masking headers. */
export function readMaskingNotice(
  headers: HttpHeaders | null | undefined
): MaskingNotice | null {
  if (!headers) return null;
  const rawFields = headers.get(MASKED_FIELDS_HEADER)?.trim() ?? '';
  const raw = headers.get(MASKING_REWRITES_HEADER)?.trim() ?? '';
  if (!rawFields && !raw) return null;

  const fields: string[] = [];
  for (const part of rawFields.split(',')) {
    const item = part.trim();
    if (!item || item === '*' || MORE.test(item)) continue;
    const name = decode(item);
    if (name && !fields.includes(name)) fields.push(name);
  }

  const groups = new Map<DroppedKind, DroppedGroup>();
  let more = 0;
  for (const part of raw.split(',')) {
    const item = part.trim();
    if (!item) continue;
    const m = MORE.exec(item);
    if (m) {
      more += Number(m[1]);
      continue;
    }
    const colon = item.indexOf(':');
    const kind =
      KINDS[colon > 0 ? item.slice(0, colon).trim().toLowerCase() : 'filter'] ??
      'filter';
    const name = decode(colon > 0 ? item.slice(colon + 1).trim() : item);
    let group = groups.get(kind);
    if (!group) {
      group = { kind, columns: [], all: false };
      groups.set(kind, group);
    }
    if (name === '*') group.all = true;
    else if (name && !group.columns.includes(name)) group.columns.push(name);
  }
  return {
    masked: rawFields !== '',
    fields,
    dropped: [...groups.values()],
    more,
  };
}

/** What the Data Explorer note says: one line, built from the header. */
export interface MaskingNote {
  /**
   * Masked columns a filter could not use (they matched no rows); empty
   * when only the whole filter was named (`*`); null without filter items.
   */
  filter: string[] | null;
  /** Masked columns a sort or group by ignored; null without any. */
  sort: string[] | null;
  /** Further items the header left out (`+N more`). */
  more: number;
}

/**
 * The note for a response, or null when there is nothing to say. Data
 * Explorer sends no `fields` or `group`, so a `fields` item (an aggregate
 * the server removed) has no line of its own; group by reads as a sort.
 */
export function maskingNoteFor(
  notice: MaskingNotice | null | undefined
): MaskingNote | null {
  if (!notice) return null;
  const f = notice.dropped.find(g => g.kind === 'filter');
  const filter = f && (f.all || f.columns.length) ? f.columns : null;
  const sorted = notice.dropped
    .filter(g => g.kind === 'order' || g.kind === 'group')
    .flatMap(g => g.columns);
  const sort = sorted.length ? [...new Set(sorted)] : null;
  if (!filter && !sort) return null;
  return { filter, sort, more: notice.more };
}

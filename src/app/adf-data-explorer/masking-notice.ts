/**
 * What df-masking (commercial Data Masking) said about a data response, read
 * from its headers. Both are absent unless the package is installed, masking
 * is on, and the response carries a masked column, so OSS and unmasked use
 * never produce a notice.
 *
 * - `X-DreamFactory-Masking: on` - some values in this response are masked.
 * - `X-DreamFactory-Masking-Dropped: filter:email,order:last%20name,+2 more`
 *   - request parts that met a masked column (column names only,
 *   percent-encoded per RFC 3986, `*` = the whole filter, capped with
 *   `,+N more`). `filter:<col>` means conditions on that column matched no
 *   rows: the server treats a comparison it may not evaluate as unknown
 *   (SQL NULL), so a filter never widens. `order:`/`group:` were ignored.
 */
import { HttpHeaders } from '@angular/common/http';

export const MASKING_HEADER = 'X-DreamFactory-Masking';
export const MASKING_DROPPED_HEADER = 'X-DreamFactory-Masking-Dropped';

export type DroppedKind = 'filter' | 'order' | 'group' | 'fields';

export interface DroppedGroup {
  kind: DroppedKind;
  /** Column names, decoded, in header order. */
  columns: string[];
  /** The whole filter was ignored (it could not be checked safely). */
  all: boolean;
}

export interface MaskingNotice {
  /** Values in this response are masked. */
  masked: boolean;
  /** Ignored request parts, one group per kind, in header order. */
  dropped: DroppedGroup[];
  /** Further ignored parts the header left out (`+N more`). */
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
  const masked = headers.get(MASKING_HEADER)?.trim().toLowerCase() === 'on';
  const raw = headers.get(MASKING_DROPPED_HEADER)?.trim() ?? '';
  if (!masked && !raw) return null;

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
  return { masked, dropped: [...groups.values()], more };
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

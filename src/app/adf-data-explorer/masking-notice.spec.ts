import { HttpHeaders } from '@angular/common/http';
import { maskingNoteFor, readMaskingNotice } from './masking-notice';

describe('readMaskingNotice', () => {
  it('is null without masking headers (OSS, masking off, nothing masked)', () => {
    expect(readMaskingNotice(new HttpHeaders())).toBeNull();
    expect(readMaskingNotice(null)).toBeNull();
    expect(
      readMaskingNotice(new HttpHeaders({ 'Content-Type': 'application/json' }))
    ).toBeNull();
  });

  it('Preview masks nothing: no marker', () => {
    expect(
      readMaskingNotice(
        new HttpHeaders({
          'X-DreamFactory-Masking': 'preview',
          'X-DreamFactory-Masking-Would-Mask': 'email,ssn',
        })
      )
    ).toBeNull();
  });

  it('marks a masked response', () => {
    expect(
      readMaskingNotice(new HttpHeaders({ 'x-dreamfactory-masking': 'on' }))
    ).toEqual({ masked: true, dropped: [], more: 0 });
  });

  it('groups ignored parts by kind, decoding percent-encoded names', () => {
    const n = readMaskingNotice(
      new HttpHeaders({
        'X-DreamFactory-Masking': 'on',
        'X-DreamFactory-Masking-Dropped':
          'filter:email,order:last%20name,having:ssn,filter:email,filter:pr%C3%A9nom,group:city,fields:dob',
      })
    )!;
    expect(n.dropped).toEqual([
      { kind: 'filter', columns: ['email', 'ssn', 'prénom'], all: false },
      { kind: 'order', columns: ['last name'], all: false },
      { kind: 'group', columns: ['city'], all: false },
      { kind: 'fields', columns: ['dob'], all: false },
    ]);
    expect(n.more).toBe(0);
  });

  it('reads the whole-filter drop, the "+N more" cap, and keeps bad escapes raw', () => {
    const n = readMaskingNotice(
      new HttpHeaders({
        'X-DreamFactory-Masking-Dropped': 'filter:*, order:a%zz ,+3 more',
      })
    )!;
    expect(n.masked).toBe(false);
    expect(n.dropped).toEqual([
      { kind: 'filter', columns: [], all: true },
      { kind: 'order', columns: ['a%zz'], all: false },
    ]);
    expect(n.more).toBe(3);
  });
});

describe('maskingNoteFor (decision 20: filters on masked columns match no rows)', () => {
  const notice = (dropped: string) =>
    readMaskingNotice(
      new HttpHeaders({
        'X-DreamFactory-Masking': 'on',
        'X-DreamFactory-Masking-Dropped': dropped,
      })
    );

  it('nothing to say without the Dropped header (or without headers)', () => {
    expect(maskingNoteFor(null)).toBeNull();
    expect(
      maskingNoteFor(
        readMaskingNotice(new HttpHeaders({ 'X-DreamFactory-Masking': 'on' }))
      )
    ).toBeNull();
  });

  it('filter and having columns read as "can\'t be filtered"; order and group as "sort ignored"', () => {
    expect(
      maskingNoteFor(notice('filter:email,having:ssn,order:last%20name'))
    ).toEqual({ filter: ['email', 'ssn'], sort: ['last name'], more: 0 });
    expect(maskingNoteFor(notice('order:ssn,group:ssn,group:city'))).toEqual({
      filter: null,
      sort: ['ssn', 'city'],
      more: 0,
    });
  });

  it('the whole filter (*) has no column list; "+N more" is kept', () => {
    expect(maskingNoteFor(notice('filter:*,+2 more'))).toEqual({
      filter: [],
      sort: null,
      more: 2,
    });
  });

  it('an aggregate item alone (fields:) has no line: Data Explorer never sends one', () => {
    expect(maskingNoteFor(notice('fields:dob'))).toBeNull();
  });
});

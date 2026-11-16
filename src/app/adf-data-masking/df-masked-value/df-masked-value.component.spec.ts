import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfMaskedValueComponent } from './df-masked-value.component';
import { MASK_GLYPH } from '../mask-format';
import { dmTransloco } from '../dm-testing';
import { MaskFormat, Tier } from '../data-masking.catalog';

@Component({
  standalone: true,
  imports: [DfMaskedValueComponent],
  template: `<df-masked-value
    [value]="value"
    [format]="format"
    [tier]="tier"></df-masked-value>`,
})
class HostComponent {
  value: string | null = null;
  format: MaskFormat | null = null;
  tier: Tier | null = 'restricted';
}

const G = MASK_GLYPH;

describe('DfMaskedValueComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const el = () => fixture.nativeElement as HTMLElement;
  const render = (value: string | null, format: MaskFormat | null = null) => {
    host.value = value;
    host.format = format;
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, dmTransloco()] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('draws one bar per masked run and keeps plain characters', () => {
    render(`${G}${G}${G}-${G}${G}-4821`, 'last4');
    const bars = el().querySelectorAll('.mv-bar');
    expect(bars.length).toBe(2);
    expect((bars[0] as HTMLElement).style.width).toBe('1.65em');
    expect(el().querySelector('.mv-text')?.textContent).toContain('4821');
    expect(el().textContent).not.toContain(G);
  });

  it('speaks a single label instead of the glyphs', () => {
    render(`${G}${G}${G}-${G}${G}-4821`, 'last4');
    expect(el().querySelector('.mv')?.getAttribute('aria-label')).toBe(
      'Masked, ends in 4821'
    );
  });

  it('caps very long runs', () => {
    render(G.repeat(40), 'redact');
    const bar = el().querySelector('.mv-bar') as HTMLElement;
    expect(bar.style.width).toBe('5.5em');
    expect(el().querySelector('.mv')?.getAttribute('aria-label')).toBe(
      'Masked'
    );
  });

  it('renders typed tokens as a chip', () => {
    render('EMAIL_7f3a91c2', 'token');
    expect(el().querySelector('.mv-token')?.textContent?.trim()).toBe(
      'EMAIL_7f3a91c2'
    );
    expect(el().querySelector('.mv')?.getAttribute('aria-label')).toBe(
      'Token EMAIL_7f3a91c2'
    );
  });

  it('renders the null format as null', () => {
    render(null, 'null');
    expect(el().querySelector('.mv-null')?.textContent).toBe('null');
  });

  it('a numeric column (null under redact) reads as masked null, not missing', () => {
    render(null, 'redact');
    const n = el().querySelector('.mv-null');
    expect(n?.textContent).toBe('null');
    expect(el().querySelector('.mv')?.getAttribute('aria-label')).toBe(
      'Masked, returned as null'
    );
  });

  it('a review column with no class or format draws a bar (the server redacts it)', () => {
    render(null, null);
    expect(el().querySelector('.mv-null')).toBeNull();
    expect(el().querySelectorAll('.mv-bar').length).toBe(1);
  });

  it('tints by tier', () => {
    render(`${G}${G}`, 'redact');
    expect(el().querySelector('.mv')?.classList).toContain(
      'dm-tier-restricted'
    );
  });
  describe('privacy guard', () => {
    it('draws a full bar, never the text, for a raw value', () => {
      render('123-45-6789', 'last4');
      expect(el().textContent).not.toContain('6789');
      expect(el().querySelectorAll('.mv-bar').length).toBe(1);
      expect(el().querySelector('.mv')?.getAttribute('aria-label')).toBe(
        'Masked'
      );
    });

    it('treats an unmasked free-text example as raw', () => {
      render('Patient reports chest pain', 'span');
      expect(el().textContent).not.toContain('chest');
      expect(el().querySelectorAll('.mv-bar').length).toBe(1);
    });

    it('caps how much free text is drawn', () => {
      render(`Call me on ${G.repeat(6)} ` + 'x'.repeat(200), 'span');
      const text = el().querySelector('.mv-text')?.textContent ?? '';
      expect(text.length).toBeLessThanOrEqual(48);
    });

    it('does not render a token-format value that is not a token', () => {
      render('jane@example.com', 'token');
      expect(el().querySelector('.mv-token')).toBeNull();
      expect(el().textContent).not.toContain('jane');
    });

    it('allows a bare year in the year format', () => {
      render('1984', 'year');
      expect(el().querySelector('.mv-text')?.textContent).toContain('1984');
    });

    it('rejects a full date in the year format', () => {
      render('1984-03-02', 'year');
      expect(el().textContent).not.toContain('03');
    });

    it('keeps each plain run in its own shrinkable segment', () => {
      render(`Call Jane at ${G.repeat(6)} or ${G.repeat(6)}`, 'span');
      const segs = Array.from(el().querySelectorAll('.mv-seg')).map(
        s => s.textContent
      );
      // Spaces survive (white-space: pre), so " or " reads as a word.
      expect(segs).toEqual(['Call Jane at ', ' or ']);
      expect(el().querySelectorAll('.mv-bar').length).toBe(2);
    });

    it('spaces the last bar from kept characters', () => {
      render(`${G.repeat(4)}5911`, 'last4');
      expect(el().querySelector('.mv-bar')?.classList).toContain('before-text');
    });
  });
});

import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { DfDataMaskingComponent } from './df-data-masking.component';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DataMaskingStore } from '../data-masking.store';
import { dmTransloco } from '../dm-testing';
import { MaskingMode } from '../data-masking.types';

function fakeStore(mode: MaskingMode = 'preview') {
  return {
    overview: {
      mode,
      scan: { status: 'idle', columns: 10 },
      counts: { masked: 167, review: 20, clear: 300 },
      you: { canGrant: true, seesRealValues: false },
    } as {
      mode: MaskingMode;
      scan: { status: string; columns: number };
      counts: { masked: number; review: number; clear: number };
      you: { canGrant: boolean; seesRealValues: boolean };
    } | null,
    get mode() {
      return this.overview?.mode ?? 'off';
    },
    get counts() {
      return this.overview!.counts;
    },
    get maskedTotal() {
      return this.overview!.counts.masked + this.overview!.counts.review;
    },
    get canLower() {
      return !!this.overview?.you.canGrant;
    },
    get foundColumns() {
      const c = this.overview?.counts;
      return (
        (!!c && c.masked + c.review + c.clear > 0) ||
        (this.overview?.scan.columns ?? 0) > 0
      );
    },
    unscanned: false,
    scanned: true,
    modeSaving: false,
    failed: new Set(),
    services: [{}, {}, {}],
    maskedDatabases: 3,
    loading: true,
    loadFailed: false,
    load: jest.fn(),
    startWatching: jest.fn(),
    stopWatching: jest.fn(),
    setMode: jest.fn(),
    showColumns: jest.fn(),
    plural: (k: string, n: number) => `${n} ${k}`,
    t: (k: string, p?: Record<string, unknown>) =>
      p ? `${k}:${JSON.stringify(p)}` : k,
  };
}

describe('DfDataMaskingComponent (mode)', () => {
  let fixture: ComponentFixture<DfDataMaskingComponent>;
  let store: ReturnType<typeof fakeStore>;
  let dialog: { open: jest.Mock };
  let closeWith: boolean;

  beforeEach(() => {
    store = fakeStore();
    closeWith = true;
    dialog = {
      open: jest.fn(() => ({ afterClosed: () => of(closeWith) })),
    };
    TestBed.configureTestingModule({
      imports: [
        DfDataMaskingComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        dmTransloco(),
      ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ data: 'ok' }),
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    });
    TestBed.overrideComponent(DfDataMaskingComponent, {
      set: { providers: [{ provide: DataMaskingStore, useValue: store }] },
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
    fixture = TestBed.createComponent(DfDataMaskingComponent);
    fixture.detectChanges();
  });

  it('turning on asks first: total masked, who (you included), what is left to review', () => {
    fixture.componentInstance.requestMode('on');
    expect(dialog.open).toHaveBeenCalledTimes(1);
    const data = dialog.open.mock.calls[0][1].data;
    expect(data.title).toBe('mode.confirmOn.title');
    // When On, review columns are masked too: the total, once.
    expect(data.message).toContain('mode.confirmOn.message:');
    expect(data.message).toContain('"columns":"187 columns"');
    expect(data.message).toContain('"databases":"3 databases"');
    expect(data.message).toContain('mode.confirmOn.review:{"review":20}');
    expect(store.setMode).toHaveBeenCalledWith('on');
  });

  it('the turn-on confirm drops "you included" for an admin with access', () => {
    store.overview!.you.seesRealValues = true;
    store.overview!.counts.review = 0;
    fixture.componentInstance.requestMode('on');
    const data = dialog.open.mock.calls[0][1].data;
    expect(data.message).toContain('mode.confirmOn.messageWithAccess:');
    expect(data.message).not.toContain('mode.confirmOn.review');
  });

  it('the real copy is short and says admins are masked too', () => {
    const real = TestBed.inject(TranslocoService);
    const msg = real.translate('dataMasking.mode.confirmOn.message', {
      columns: '187 columns',
      databases: '3 databases',
    });
    expect(msg).toBe(
      '187 columns in 3 databases will be masked for apps, AI tools and admins, you included.'
    );
  });

  it('leaving On for Preview asks first (masking stops)', () => {
    store.overview!.mode = 'on';
    fixture.componentInstance.requestMode('preview');
    expect(store.setMode).toHaveBeenCalledWith('preview');
    expect(dialog.open).toHaveBeenCalledTimes(1);
    const data = dialog.open.mock.calls[0][1].data;
    expect(data.title).toBe('mode.confirmPreview.title');
    expect(data.danger).toBe(true);
  });

  it('a cancelled On to Preview changes nothing', () => {
    closeWith = false;
    store.overview!.mode = 'on';
    fixture.componentInstance.requestMode('preview');
    expect(store.setMode).not.toHaveBeenCalled();
  });

  it('Preview to Off needs no dialog (nothing was masked)', () => {
    store.overview!.mode = 'preview';
    fixture.componentInstance.requestMode('off');
    expect(dialog.open).not.toHaveBeenCalled();
    expect(store.setMode).toHaveBeenCalledWith('off');
  });

  it('the toggle never shows a mode before it is confirmed', () => {
    closeWith = false;
    const el: HTMLElement = fixture.nativeElement;
    const btn = (m: string) =>
      el.querySelector(`[data-testid="dm-mode-${m}"] button`) as HTMLElement;
    jest.useFakeTimers();
    btn('on').click();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fixture.detectChanges();
    // Back to the mode in force while the dialog is open, and after cancel.
    expect(fixture.componentInstance.modeGroup!.value).toBe('preview');
    expect(btn('preview').getAttribute('aria-pressed')).toBe('true');
    expect(btn('on').getAttribute('aria-pressed')).toBe('false');
    expect(store.setMode).not.toHaveBeenCalled();
  });

  it('ignores mode requests while a mode change is saving', () => {
    store.modeSaving = true;
    store.overview!.mode = 'off';
    fixture.componentInstance.requestMode('preview');
    expect(store.setMode).not.toHaveBeenCalled();
  });

  it('turning off from On is a danger confirm', () => {
    store.overview!.mode = 'on';
    fixture.componentInstance.requestMode('off');
    const data = dialog.open.mock.calls[0][1].data;
    expect(data.danger).toBe(true);
    expect(store.setMode).toHaveBeenCalledWith('off');
  });

  it('Off to Preview needs no dialog', () => {
    store.overview!.mode = 'off';
    fixture.componentInstance.requestMode('preview');
    expect(dialog.open).not.toHaveBeenCalled();
    expect(store.setMode).toHaveBeenCalledWith('preview');
  });

  it('header counts jump to the matching Columns filter', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="dm-count-review"]'
    );
    expect(btn.textContent).toContain('20');
    btn.click();
    expect(store.showColumns).toHaveBeenCalledWith('review');
  });

  it('header counts are disjoint: masked, then to review', () => {
    const el: HTMLElement = fixture.nativeElement;
    const masked = el.querySelector('[data-testid="dm-count-masked"]')!;
    expect(masked.textContent).toContain('167');
    expect(
      el.querySelector('[data-testid="dm-count-review"]')!.textContent
    ).toContain('20');
  });

  it('while the overview loads, no mode is shown as selected', () => {
    store.overview = null;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="dm-mode"]')).toBeNull();
    expect(el.querySelector('[data-testid="dm-mode-loading"]')).toBeTruthy();
  });

  it('before any scan with masking off, the page leads with the scan, not the mode', () => {
    store.unscanned = true;
    store.overview!.mode = 'off';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="dm-count-masked"]')).toBeNull();
    expect(el.querySelector('[data-testid="dm-mode"]')).toBeNull();
  });

  it('before any scan with masking left on, Off stays reachable; Preview and On wait', () => {
    store.unscanned = true;
    store.scanned = false;
    store.overview!.mode = 'on';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = (m: string) =>
      el.querySelector(
        `[data-testid="dm-mode-${m}"] button`
      ) as HTMLButtonElement;
    expect(btn('off').disabled).toBe(false);
    expect(btn('preview').disabled).toBe(true);
    fixture.componentInstance.requestMode('preview');
    expect(store.setMode).not.toHaveBeenCalled();
  });

  it('while the first scan runs (columns arriving, none finished), Preview and On still wait', () => {
    // Live, the first columns land before the scan ends: the counts show,
    // but the server refuses On until a scan has finished.
    store.unscanned = false;
    store.scanned = false;
    store.overview!.mode = 'off';
    store.overview!.scan = { status: 'running', columns: 12 };
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = (m: string) =>
      el.querySelector(
        `[data-testid="dm-mode-${m}"] button`
      ) as HTMLButtonElement;
    expect(btn('off').disabled).toBe(false);
    expect(btn('preview').disabled).toBe(true);
    expect(btn('on').disabled).toBe(true);
    fixture.componentInstance.requestMode('on');
    expect(dialog.open).not.toHaveBeenCalled();
    expect(store.setMode).not.toHaveBeenCalled();
    // Once it has finished, both are offered.
    store.scanned = true;
    fixture.detectChanges();
    expect(btn('preview').disabled).toBe(false);
    expect(btn('on').disabled).toBe(false);
  });

  it('a finished scan that found no columns counts as no scan: no mode control, and On waits', () => {
    // Default install: `df:masking setup` scanned only the empty built-in
    // db. The server refuses On (409) until a scan finds columns.
    store.unscanned = false;
    store.scanned = true;
    store.overview!.mode = 'off';
    store.overview!.scan = { status: 'idle', columns: 0 };
    store.overview!.counts = { masked: 0, review: 0, clear: 0 };
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="dm-mode"]')).toBeNull();
    expect(el.querySelector('[data-testid="dm-count-masked"]')).toBeNull();
    // A mode set by other means (Apply sets Preview): Off stays reachable.
    store.overview!.mode = 'preview';
    fixture.detectChanges();
    const btn = (m: string) =>
      el.querySelector(
        `[data-testid="dm-mode-${m}"] button`
      ) as HTMLButtonElement;
    expect(btn('off').disabled).toBe(false);
    expect(btn('on').disabled).toBe(true);
    fixture.componentInstance.requestMode('on');
    expect(dialog.open).not.toHaveBeenCalled();
    expect(store.setMode).not.toHaveBeenCalled();
    // The next scan finds columns: On is offered.
    store.overview!.scan = { status: 'idle', columns: 12 };
    store.overview!.counts = { masked: 2, review: 0, clear: 10 };
    fixture.detectChanges();
    expect(btn('on').disabled).toBe(false);
  });

  it('with masking On, an admin who cannot lower it sees Off and Preview locked', () => {
    store.overview!.mode = 'on';
    store.overview!.you.canGrant = false;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = (m: string) =>
      el.querySelector(
        `[data-testid="dm-mode-${m}"] button`
      ) as HTMLButtonElement;
    expect(btn('off').disabled).toBe(true);
    expect(btn('preview').disabled).toBe(true);
    expect(btn('on').disabled).toBe(false);
    expect(
      el.querySelector('[data-testid="dm-mode-lock"]')!.textContent
    ).toContain('Only the super admin can lower the masking mode.');
    fixture.componentInstance.requestMode('off');
    expect(dialog.open).not.toHaveBeenCalled();
    // In Preview the same admin may raise it again.
    store.overview!.mode = 'preview';
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="dm-mode-lock"]')).toBeNull();
    expect(btn('on').disabled).toBe(false);
  });
});

describe('DfDataMaskingComponent (?filter= deep link)', () => {
  function create(loading: boolean) {
    // loadFailed keeps the tab body out: this is about the shell only.
    const store = {
      ...fakeStore(),
      loading,
      loadFailed: true,
      filter: null as string | null,
    };
    TestBed.configureTestingModule({
      imports: [
        DfDataMaskingComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        dmTransloco(),
      ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ data: 'ok' }),
            queryParamMap: of(convertToParamMap({ filter: 'review' })),
          },
        },
      ],
    });
    TestBed.overrideComponent(DfDataMaskingComponent, {
      set: { providers: [{ provide: DataMaskingStore, useValue: store }] },
    });
    const router = TestBed.inject(Router);
    const nav = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(DfDataMaskingComponent);
    fixture.detectChanges();
    return { store, nav };
  }

  it('opens Columns on the filter once loaded, then drops it from the URL', () => {
    const { store, nav } = create(false);
    expect(store.showColumns).toHaveBeenCalledWith('review');
    expect(nav).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { filter: null } })
    );
  });

  it('hands the filter to the first Columns view while loading', () => {
    const { store } = create(true);
    expect(store.filter).toBe('review');
    expect(store.showColumns).not.toHaveBeenCalled();
  });
});

/** The shared paywall tracks a hit and boots Calendly: stubbed here. */
@Component({ selector: 'df-paywall', standalone: true, template: '' })
class StubPaywallComponent {
  @Input() serviceName = '';
}

describe('DfDataMaskingComponent (paywall)', () => {
  it('without the data_masking resource shows the shared paywall, on any license', () => {
    const store = fakeStore();
    TestBed.configureTestingModule({
      imports: [
        DfDataMaskingComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        dmTransloco(),
      ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ data: 'paywall' }),
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    });
    TestBed.overrideComponent(DfDataMaskingComponent, {
      remove: { imports: [DfPaywallComponent], providers: [DataMaskingStore] },
      add: {
        imports: [StubPaywallComponent],
        providers: [{ provide: DataMaskingStore, useValue: store }],
      },
    });
    const fixture = TestBed.createComponent(DfDataMaskingComponent);
    fixture.detectChanges();
    const paywall = fixture.debugElement.query(
      By.directive(StubPaywallComponent)
    );
    expect(paywall).toBeTruthy();
    expect(paywall.componentInstance.serviceName).toBe('Data Masking');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dm')).toBeNull();
    expect(store.load).not.toHaveBeenCalled();
    expect(store.startWatching).not.toHaveBeenCalled();
  });
});

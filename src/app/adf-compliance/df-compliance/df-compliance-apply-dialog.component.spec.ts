import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';
import {
  ApplyDialogData,
  DfComplianceApplyDialogComponent,
} from './df-compliance-apply-dialog.component';
import { cpTransloco } from '../compliance-testing';
import { BaselineChange } from '../compliance.types';

const RULES: BaselineChange[] = [
  { id: 'rule:0', text: 'Add a detection rule: medical record numbers.' },
];
const WITH_ON: BaselineChange[] = [
  { id: 'mode', text: 'Turn masking on (now Preview).' },
  ...RULES,
];

describe('DfComplianceApplyDialogComponent', () => {
  let fixture: ComponentFixture<DfComplianceApplyDialogComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const listed = () =>
    Array.from(
      el().querySelectorAll('[data-testid="cp-apply-changes"] li')
    ).map(li => li.textContent?.trim());
  const toggleTurnOn = () => {
    (
      el().querySelector(
        '[data-testid="cp-apply-turn-on"] input'
      ) as HTMLInputElement
    ).click();
    fixture.detectChanges();
  };

  function create(data: ApplyDialogData) {
    TestBed.configureTestingModule({
      imports: [
        DfComplianceApplyDialogComponent,
        NoopAnimationsModule,
        cpTransloco(),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
      ],
    });
    fixture = TestBed.createComponent(DfComplianceApplyDialogComponent);
    fixture.detectChanges();
  }

  it('lists exactly the server changes, and the mode-on list while turning on', () => {
    create({
      name: 'HIPAA',
      changes: RULES,
      offerTurnOn: true,
      changesOn$: of(WITH_ON),
    });
    expect(el().textContent).toContain('Apply HIPAA baseline?');
    expect(
      el().querySelector('[data-testid="cp-apply-turn-on"]')?.textContent
    ).toContain('Mask values now (masking On)');
    expect(listed()).toEqual([RULES[0].text]);
    toggleTurnOn();
    expect(listed()).toEqual(WITH_ON.map(c => c.text));
    toggleTurnOn();
    expect(listed()).toEqual([RULES[0].text]);
  });

  it('shows the turn-on change even when nothing else would change', () => {
    create({
      name: 'GDPR',
      changes: [],
      offerTurnOn: true,
      changesOn$: of([WITH_ON[0]]),
    });
    expect(el().querySelector('[data-testid="cp-apply-none"]')).toBeTruthy();
    toggleTurnOn();
    expect(listed()).toEqual([WITH_ON[0].text]);
  });

  it('keeps the plain list until the mode-on list arrives, or if it fails', () => {
    const later = new Subject<BaselineChange[]>();
    create({
      name: 'HIPAA',
      changes: RULES,
      offerTurnOn: true,
      changesOn$: later,
    });
    toggleTurnOn();
    expect(listed()).toEqual([RULES[0].text]);
    later.next(WITH_ON);
    fixture.detectChanges();
    expect(listed()).toEqual(WITH_ON.map(c => c.text));

    TestBed.resetTestingModule();
    create({
      name: 'HIPAA',
      changes: RULES,
      offerTurnOn: true,
      changesOn$: throwError(() => new Error('offline')),
    });
    toggleTurnOn();
    expect(listed()).toEqual([RULES[0].text]);
  });

  it('starts with turning masking on ticked when asked (the Fix of "Masking is on")', async () => {
    create({
      name: 'HIPAA',
      changes: [],
      offerTurnOn: true,
      turnOn: true,
      changesOn$: of([WITH_ON[0]]),
    });
    // ngModel writes the initial value asynchronously.
    await fixture.whenStable();
    fixture.detectChanges();
    const box = el().querySelector(
      '[data-testid="cp-apply-turn-on"] input'
    ) as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(listed()).toEqual([WITH_ON[0].text]);
    expect(fixture.componentInstance.turnOn).toBe(true);
  });

  it('never says "settings already match" while turning masking on', () => {
    // The mode-on list is still loading (or failed): the plain list is empty.
    create({
      name: 'GDPR',
      changes: [],
      offerTurnOn: true,
      changesOn$: new Subject<BaselineChange[]>(),
    });
    expect(el().querySelector('[data-testid="cp-apply-none"]')).toBeTruthy();
    toggleTurnOn();
    expect(el().querySelector('[data-testid="cp-apply-none"]')).toBeNull();
  });

  it('never presets turning masking on when it is not offered', () => {
    create({ name: 'HIPAA', changes: RULES, offerTurnOn: false, turnOn: true });
    expect(fixture.componentInstance.turnOn).toBe(false);
    expect(el().querySelector('[data-testid="cp-apply-turn-on"]')).toBeNull();
  });

  it('offers no turn-on choice when masking is already on', () => {
    create({ name: 'HIPAA', changes: RULES, offerTurnOn: false });
    expect(el().querySelector('[data-testid="cp-apply-turn-on"]')).toBeNull();
    expect(listed()).toEqual([RULES[0].text]);
  });
});

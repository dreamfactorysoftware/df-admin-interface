import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { DfSemanticTablePickerComponent } from './df-semantic-table-picker.component';
import { filterTables } from './semantic-catalog';
import { translocoEn } from './semantic-i18n.testing';

const many = Array.from(
  { length: 1200 },
  (_, i) => `t_${String(i + 1).padStart(4, '0')}`
);

describe('filterTables', () => {
  it('caps what a picker renders and counts the rest', () => {
    const r = filterTables(many, '');
    expect(r.matches).toHaveLength(50);
    expect(r.hidden).toBe(1150);
  });

  it('matches anywhere, case-insensitive, names starting with the query first', () => {
    const r = filterTables(
      ['customer_orders', 'orders', 'ORDER_lines', 'x'],
      'order'
    );
    expect(r.matches).toEqual(['orders', 'ORDER_lines', 'customer_orders']);
    expect(r.hidden).toBe(0);
  });
});

describe('DfSemanticTablePickerComponent', () => {
  let fixture: ComponentFixture<DfSemanticTablePickerComponent>;
  let picker: DfSemanticTablePickerComponent;
  let emitted: string[];

  function setup(tables: string[], value = '') {
    TestBed.configureTestingModule({
      imports: [
        DfSemanticTablePickerComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot(translocoEn),
      ],
    });
    fixture = TestBed.createComponent(DfSemanticTablePickerComponent);
    picker = fixture.componentInstance;
    emitted = [];
    picker.valueChange.subscribe(v => emitted.push(v));
    fixture.componentRef.setInput('tables', tables);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('testId', 'tp');
    fixture.detectChanges();
  }

  function openPanel() {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('[data-testid="tp"]');
    input.dispatchEvent(new Event('focusin'));
    input.focus();
    fixture.detectChanges();
  }

  const options = () =>
    Array.from(
      document.querySelectorAll('.cdk-overlay-container mat-option')
    ) as HTMLElement[];

  it('renders a bounded page of options for a 1,200-table service', () => {
    setup(many);
    openPanel();
    const opts = options();
    // 50 names plus the "1150 more match" line.
    expect(opts).toHaveLength(51);
    expect(opts[50].textContent).toContain('1150 more match');
  });

  it('typing narrows the options and does not change the value', () => {
    setup(many);
    picker.onQuery('t_119');
    fixture.detectChanges();
    expect(picker.matches).toEqual([
      't_1190',
      't_1191',
      't_1192',
      't_1193',
      't_1194',
      't_1195',
      't_1196',
      't_1197',
      't_1198',
      't_1199',
    ]);
    expect(emitted).toEqual([]);
  });

  it('commits a typed exact name on blur and reverts anything else', () => {
    setup(['orders', 'customers'], 'customers');
    picker.onQuery('ORDERS');
    picker.commit();
    expect(emitted).toEqual(['orders']);
    picker.onQuery('ord');
    picker.commit();
    expect(emitted).toEqual(['orders']);
    expect(picker.query).toBe('orders');
  });

  it('takes free text when the table list is unknown', () => {
    setup([]);
    picker.onQuery('legacy_orders');
    picker.commit();
    expect(emitted).toEqual(['legacy_orders']);
    expect(
      fixture.nativeElement.querySelector('mat-hint').textContent
    ).toContain('could not be loaded');
  });
});

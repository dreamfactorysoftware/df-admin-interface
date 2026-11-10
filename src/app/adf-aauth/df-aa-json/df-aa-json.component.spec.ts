import { TestBed } from '@angular/core/testing';
import { aauthTransloco } from '../aauth-testing';
import { DfAaJsonComponent } from './df-aa-json.component';

describe('DfAaJsonComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [DfAaJsonComponent, aauthTransloco()],
    })
  );

  function render(inputs: Partial<DfAaJsonComponent>) {
    const fixture = TestBed.createComponent(DfAaJsonComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('is a named, focusable region so keys can scroll long lines', () => {
    const el = render({
      value: { iss: 'https://df.example.test' },
      label: 'Payload',
    });
    const pre = el.querySelector('pre');
    expect(pre?.getAttribute('tabindex')).toBe('0');
    expect(pre?.getAttribute('role')).toBe('region');
    expect(pre?.getAttribute('aria-label')).toBe('Payload');
    expect(pre?.textContent).toContain('"iss": "https://df.example.test"');
  });

  it('scrolls by default and wraps on request', () => {
    expect(render({ value: { a: 1 } }).classList).not.toContain('wrap');
    expect(render({ value: { a: 1 }, wrap: true }).classList).toContain('wrap');
  });
});

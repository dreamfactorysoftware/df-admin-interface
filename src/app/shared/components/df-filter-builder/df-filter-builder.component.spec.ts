import { TestBed } from '@angular/core/testing';
import { DfFilterBuilderComponent } from './df-filter-builder.component';

// Logic-only suite: exercises the pure compile/emit math without rendering, so
// no transloco runtime provider is required.
describe('DfFilterBuilderComponent', () => {
  let component: DfFilterBuilderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfFilterBuilderComponent],
    }).compileComponents();
    component = TestBed.createComponent(DfFilterBuilderComponent).componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('quotes string values and leaves numbers bare', () => {
    component.conditions = [
      { field: 'status', operator: '=', value: 'active' },
      { field: 'age', operator: '>', value: '21' },
    ];
    expect(component.compile()).toBe("(status = 'active') and (age > 21)");
  });

  it('joins with OR when the conjunction is or', () => {
    component.conjunction = 'or';
    component.conditions = [
      { field: 'a', operator: '=', value: '1' },
      { field: 'b', operator: '=', value: '2' },
    ];
    expect(component.compile()).toBe('(a = 1) or (b = 2)');
  });

  it('desugars contains / starts with / ends with to LIKE', () => {
    component.conditions = [
      { field: 'name', operator: 'contains', value: 'ada' },
    ];
    expect(component.compile()).toBe("(name like '%ada%')");
    component.conditions = [
      { field: 'name', operator: 'starts with', value: 'ad' },
    ];
    expect(component.compile()).toBe("(name like 'ad%')");
    component.conditions = [
      { field: 'name', operator: 'ends with', value: 'da' },
    ];
    expect(component.compile()).toBe("(name like '%da')");
  });

  it('renders IN as a parenthesised, quoted list', () => {
    component.conditions = [
      { field: 'id', operator: 'in', value: '1, 2, 3' },
    ];
    expect(component.compile()).toBe('(id in (1, 2, 3))');
    component.conditions = [
      { field: 'role', operator: 'in', value: 'admin, user' },
    ];
    expect(component.compile()).toBe("(role in ('admin', 'user'))");
  });

  it('omits the value slot for null operators', () => {
    component.conditions = [
      { field: 'deleted_at', operator: 'is null', value: 'ignored' },
    ];
    expect(component.compile()).toBe('(deleted_at is null)');
  });

  it('escapes embedded single quotes', () => {
    component.conditions = [
      { field: 'name', operator: '=', value: "O'Brien" },
    ];
    expect(component.compile()).toBe("(name = 'O''Brien')");
  });

  it('skips incomplete conditions', () => {
    component.conditions = [
      { field: '', operator: '=', value: 'x' },
      { field: 'a', operator: '=', value: '' },
      { field: 'b', operator: '=', value: '2' },
    ];
    expect(component.compile()).toBe('(b = 2)');
  });

  it('emits the raw string verbatim in raw mode', () => {
    const emitted: string[] = [];
    component.filterChange.subscribe(v => emitted.push(v));
    component.rawFilter = "(x = 'y')";
    component.mode = 'raw';
    component.emit();
    expect(emitted).toEqual(["(x = 'y')"]);
    expect(component.currentFilter).toBe("(x = 'y')");
  });

  it('hands the compiled visual string to the raw box on first switch', () => {
    component.conditions = [{ field: 'age', operator: '>', value: '21' }];
    component.onModeChange('raw');
    expect(component.rawFilter).toBe('(age > 21)');
  });
});

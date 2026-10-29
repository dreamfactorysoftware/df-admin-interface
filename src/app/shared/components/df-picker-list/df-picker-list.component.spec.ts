import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DfPickerListComponent, PickerItem } from './df-picker-list.component';

function items(n: number, prefix = 'role'): PickerItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    label: `${prefix}_${String(i + 1).padStart(3, '0')}`,
  }));
}

describe('DfPickerListComponent', () => {
  let fixture: ComponentFixture<DfPickerListComponent>;
  let component: DfPickerListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfPickerListComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(DfPickerListComponent);
    component = fixture.componentInstance;
  });

  function setItems(list: PickerItem[], selected: Array<number | string> = []) {
    component.items = list;
    component.selected = selected;
    component.ngOnChanges({
      items: {
        currentValue: list,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
  }

  const chips = () =>
    fixture.nativeElement.querySelectorAll('[data-testid="picker-item"]');
  const labels = () =>
    Array.from(chips()).map((el: any) => el.textContent.trim());

  it('renders only one page of chips and offers the rest behind "Show more"', () => {
    setItems(items(314));
    expect(chips().length).toBe(60);
    expect(component.hiddenCount).toBe(254);
    const more = fixture.nativeElement.querySelector(
      '[data-testid="picker-more"]'
    );
    expect(more.textContent).toContain('Show 60 more');
    more.click();
    fixture.detectChanges();
    expect(chips().length).toBe(120);
    expect(component.status).toBe('120 of 314 items shown');
  });

  it('shows no search box for a short list, so small pickers look as before', () => {
    setItems(items(5));
    expect(
      fixture.nativeElement.querySelector('[data-testid="picker-search"]')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.picker__list--bounded')
    ).toBeNull();
    expect(component.status).toBe('');
  });

  it('bounds the list and shows a search box once the list is long', () => {
    setItems(items(13));
    expect(
      fixture.nativeElement.querySelector('[data-testid="picker-search"]')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.picker__list--bounded')
    ).not.toBeNull();
  });

  it('filters chips by a case-insensitive label match', () => {
    setItems(items(314));
    component.onQuery('ROLE_29');
    fixture.detectChanges();
    // role_290..role_299
    expect(chips().length).toBe(10);
    expect(labels()[0]).toBe('role_290');
    expect(component.status).toBe('10 items match');
  });

  it('also matches an item by its keywords, so a service is found by its label', () => {
    setItems([
      { id: 'dvdstore', label: 'dvdstore', keywords: 'mysql' },
      { id: 'northwind', label: 'northwind', keywords: 'MySQL' },
      { id: 'files', label: 'files' },
    ]);
    component.onQuery('mysql');
    fixture.detectChanges();
    expect(labels()).toEqual(['dvdstore', 'northwind']);
  });

  it('tells the user when nothing matches', () => {
    setItems(items(20));
    component.onQuery('zzz');
    fixture.detectChanges();
    expect(chips().length).toBe(0);
    expect(
      fixture.nativeElement.querySelector('[data-testid="picker-nomatch"]')
        .textContent
    ).toContain('No items match “zzz”');
  });

  it('leads with the chips that were selected at load, without moving one on toggle', () => {
    setItems(items(100), [77, 3]);
    expect(labels().slice(0, 2)).toEqual(['role_003', 'role_077']);
    // Picking another chip reports the id but leaves the order alone.
    const emitted: unknown[] = [];
    component.toggle.subscribe(id => emitted.push(id));
    (chips()[4] as HTMLElement).click();
    expect(emitted).toEqual([4]);
    component.selected = [77, 3, 4];
    component.ngOnChanges({});
    fixture.detectChanges();
    expect(labels().slice(0, 3)).toEqual(['role_003', 'role_077', 'role_001']);
    expect(chips()[4].getAttribute('aria-pressed')).toBe('true');
  });

  it('says so when the host could only load part of the collection', () => {
    component.truncated = true;
    setItems(items(1000));
    expect(component.status).toBe(
      'Showing the first 1000 items only. Search to find the rest.'
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="picker-search"]')
    ).not.toBeNull();
  });

  it('sends the query to the server while truncated and renders what comes back', fakeAsync(() => {
    const remote = jest.fn((q: string) =>
      of([{ id: 5001, label: `late_${q}` }])
    );
    component.truncated = true;
    component.remoteSearch = remote;
    setItems(items(100));
    component.onQuery('late');
    fixture.detectChanges();
    // Local filter first: nothing loaded matches.
    expect(chips().length).toBe(0);
    tick(250);
    fixture.detectChanges();
    expect(remote).toHaveBeenCalledWith('late');
    expect(labels()).toEqual(['late_late']);
    // Clearing the query drops the remote result and restores the loaded list.
    component.onQuery('');
    tick(250);
    fixture.detectChanges();
    expect(chips().length).toBe(60);
  }));

  it('does not call the server when the whole collection was loaded', fakeAsync(() => {
    const remote = jest.fn(() => of([]));
    component.remoteSearch = remote;
    setItems(items(100));
    component.onQuery('role_01');
    tick(250);
    expect(remote).not.toHaveBeenCalled();
  }));

  it('renders the optional per-item link', () => {
    component.itemLink = it => ['/roles', it.id, 'scope'];
    component.itemLinkLabel = 'what can this role see?';
    setItems(items(3));
    const links = fixture.nativeElement.querySelectorAll('.picker__link');
    expect(links.length).toBe(3);
    expect(links[0].getAttribute('href')).toBe('/roles/1/scope');
  });
});

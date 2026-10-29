import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DataMaskingStore } from '../data-masking.store';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { dmTransloco } from '../dm-testing';
import { ActivityEvent, ActivityQuery } from '../data-masking.types';
import { DfDmActivityComponent } from './df-dm-activity.component';

/**
 * A busy Preview hour: 250 "would mask" rows on top of three older blocked
 * attempts. The server filters by kind and pages (ActivityHandler).
 */
function server(): ActivityEvent[] {
  const out: ActivityEvent[] = [];
  let id = 1;
  const t0 = Date.parse('2026-10-29T00:00:00Z');
  for (let i = 0; i < 3; i++) {
    out.push({
      id: id++,
      at: new Date(t0 + i * 1000).toISOString(),
      actor: 'MCP: crm_mcp',
      kind: 'blocked',
      text: 'Blocked an attempt to change the masking mode',
    });
  }
  for (let i = 0; i < 250; i++) {
    out.push({
      id: id++,
      at: new Date(t0 + 60_000 + i * 1000).toISOString(),
      actor: 'mobile-app',
      kind: 'preview',
      text: 'Would mask 3 columns',
      target: `sports.t${i}`,
    });
  }
  return out;
}

function serve(q: ActivityQuery = {}) {
  const all = server()
    .filter(e => !q.kinds?.length || q.kinds.includes(e.kind))
    .filter(e => !q.before || e.id < q.before)
    .sort((a, b) => b.id - a.id);
  const limit = q.limit ?? 200;
  return { events: all.slice(0, limit), hasMore: all.length > limit };
}

describe('DfDmActivityComponent', () => {
  let api: { activity: jest.Mock };

  function create() {
    api = { activity: jest.fn((q: ActivityQuery) => of(serve(q))) };
    TestBed.configureTestingModule({
      imports: [DfDmActivityComponent, NoopAnimationsModule, dmTransloco()],
      providers: [
        DataMaskingStore,
        { provide: DfDataMaskingApiService, useValue: api },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    });
    const fixture = TestBed.createComponent(DfDmActivityComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('the Blocked filter shows the blocked events the server holds', () => {
    const fixture = create();
    fixture.componentInstance.setFilter('blocked');
    fixture.detectChanges();
    const blocked = fixture.componentInstance.groups.flatMap(g => g.events);
    expect(blocked.length).toBe(3);
    expect(api.activity).toHaveBeenLastCalledWith({
      kinds: ['blocked'],
      limit: 200,
    });
  });

  it('All pages back with Load older', () => {
    const fixture = create();
    const el = fixture.nativeElement as HTMLElement;
    const count = () =>
      fixture.componentInstance.groups.flatMap(g => g.events).length;
    expect(count()).toBe(200);
    const older = el.querySelector(
      '[data-testid="dm-activity-older"]'
    ) as HTMLButtonElement;
    expect(older).toBeTruthy();
    older.click();
    fixture.detectChanges();
    expect(count()).toBe(253);
    expect(el.querySelector('[data-testid="dm-activity-older"]')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AauthStore } from '../aauth.store';
import { PersonServer } from '../aauth.types';
import { ALL_SCOPES, DfAaServersComponent } from './df-aa-servers.component';

describe('DfAaServersComponent scope selection', () => {
  let component: DfAaServersComponent;
  let store: {
    updateServer: jest.Mock;
    enabledScopes: { scope: string }[];
    t: (k: string) => string;
  };

  const server = (patch: Partial<PersonServer> = {}): PersonServer => ({
    id: 2,
    issuer: 'https://ps.example',
    name: 'PS',
    isLocal: false,
    enabled: true,
    scopes: ['sales.read'],
    allScopes: false,
    lastUsedAt: null,
    ...patch,
  });

  beforeEach(() => {
    store = {
      updateServer: jest.fn(),
      enabledScopes: [{ scope: 'sales.read' }, { scope: 'sales.refund' }],
      t: (k: string) => k,
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AauthStore, useValue: store },
        { provide: MatDialog, useValue: {} },
      ],
    });
    component = TestBed.runInInjectionContext(() => new DfAaServersComponent());
  });

  it('clearing the last scope saves "none", never "all"', () => {
    const s = server();
    component.pick(s, []);
    component.closed(s, false);
    expect(store.updateServer).toHaveBeenCalledWith(2, {
      scopes: [],
      allScopes: false,
    });
  });

  it('"All scopes" is an explicit option that excludes single scopes', () => {
    const s = server();
    component.pick(s, ['sales.read', ALL_SCOPES]);
    expect(component.selected(s)).toEqual([ALL_SCOPES]);
    component.closed(s, false);
    expect(store.updateServer).toHaveBeenCalledWith(2, { allScopes: true });

    const all = server({ allScopes: true, scopes: [] });
    expect(component.selected(all)).toEqual([ALL_SCOPES]);
    component.pick(all, [ALL_SCOPES, 'sales.refund']);
    expect(component.selected(all)).toEqual(['sales.refund']);
    component.closed(all, false);
    expect(store.updateServer).toHaveBeenLastCalledWith(2, {
      scopes: ['sales.refund'],
      allScopes: false,
    });
  });

  it('does not save an unchanged selection', () => {
    const s = server();
    component.pick(s, ['sales.read']);
    component.closed(s, false);
    expect(store.updateServer).not.toHaveBeenCalled();
  });
});
